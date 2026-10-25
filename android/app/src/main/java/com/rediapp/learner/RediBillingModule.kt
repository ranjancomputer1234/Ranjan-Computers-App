package com.rediapp.learner

import android.os.Handler
import android.os.Looper
import com.android.billingclient.api.*
import com.facebook.react.bridge.*
import java.security.MessageDigest

/** One-time, non-consumable course/test purchases. REDI's server verifies and
 * acknowledges purchase tokens; a native callback never grants entitlement. */
class RediBillingModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context), PurchasesUpdatedListener {
  private val main = Handler(Looper.getMainLooper())
  private var pendingPurchase: Promise? = null
  private var pendingProduct: String? = null
  private var connecting = false
  private val waiting = mutableListOf<Pair<Promise, () -> Unit>>()
  private val billing = BillingClient.newBuilder(context)
    .setListener(this)
    .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
    .enableAutoServiceReconnection()
    .build()

  override fun getName() = "RediBilling"

  private fun ready(promise: Promise, action: () -> Unit) {
    main.post {
      if (billing.isReady) { action(); return@post }
      waiting.add(promise to action)
      if (connecting) return@post
      connecting = true
      billing.startConnection(object : BillingClientStateListener {
        override fun onBillingSetupFinished(result: BillingResult) {
          main.post {
            connecting = false
            val requests = waiting.toList()
            waiting.clear()
            requests.forEach { (p, run) ->
              if (result.responseCode == BillingClient.BillingResponseCode.OK) run()
              else p.reject("billing_unavailable", "Google Play could not connect. Please try again.")
            }
          }
        }
        override fun onBillingServiceDisconnected() { connecting = false }
      })
    }
  }

  private fun product(id: String, promise: Promise, action: (ProductDetails, ProductDetails.OneTimePurchaseOfferDetails) -> Unit) {
    val params = QueryProductDetailsParams.newBuilder().setProductList(listOf(
      QueryProductDetailsParams.Product.newBuilder().setProductId(id).setProductType(BillingClient.ProductType.INAPP).build()
    )).build()
    billing.queryProductDetailsAsync(params) { result, response ->
      val detail = response.productDetailsList.firstOrNull { it.productId == id }
      val offer = detail?.oneTimePurchaseOfferDetails
      main.post {
        if (result.responseCode != BillingClient.BillingResponseCode.OK || detail == null || offer == null) {
          promise.reject("product_unavailable", "This purchase is not available from Google Play.")
        } else action(detail, offer)
      }
    }
  }

  @ReactMethod
  fun getProduct(id: String, promise: Promise) = ready(promise) {
    product(id, promise) { detail, offer ->
      promise.resolve(Arguments.createMap().apply {
        putString("productId", detail.productId)
        putString("formattedPrice", offer.formattedPrice)
        putString("currency", offer.priceCurrencyCode)
        putDouble("priceMicros", offer.priceAmountMicros.toDouble())
      })
    }
  }

  @ReactMethod
  fun purchase(id: String, priceMicros: Double, currency: String, accountId: String, promise: Promise) = ready(promise) {
    if (pendingPurchase != null) {
      promise.reject("purchase_busy", "Another purchase is already in progress.")
      return@ready
    }
    // Query again rather than retaining a stale ProductDetails object.
    product(id, promise) { detail, offer ->
      val activity = reactApplicationContext.currentActivity
      if (activity == null) {
        promise.reject("activity_unavailable", "Return to the app to purchase.")
        return@product
      }
      if (offer.priceAmountMicros != priceMicros.toLong() || offer.priceCurrencyCode != currency) {
        promise.reject("price_changed", "The price changed. Refresh checkout before purchasing.")
        return@product
      }
      if (pendingPurchase != null) {
        promise.reject("purchase_busy", "Another purchase is already in progress.")
        return@product
      }
      val productParams = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(detail)
      offer.offerToken?.let { productParams.setOfferToken(it) }
      val accountHash = MessageDigest.getInstance("SHA-256").digest(accountId.toByteArray()).joinToString("") { "%02x".format(it) }
      pendingPurchase = promise
      pendingProduct = id
      val result = billing.launchBillingFlow(activity, BillingFlowParams.newBuilder()
        .setProductDetailsParamsList(listOf(productParams.build()))
        .setObfuscatedAccountId(accountHash).build())
      if (result.responseCode != BillingClient.BillingResponseCode.OK) {
        pendingPurchase = null
        pendingProduct = null
        promise.reject(if (result.responseCode == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) "already_owned" else "billing_failed",
          "Google Play could not start this purchase. Restore purchases if you already own it.")
      }
    }
  }

  private fun purchaseMap(purchase: Purchase): WritableMap = Arguments.createMap().apply {
    putString("provider", "play_billing")
    putString("purchaseToken", purchase.purchaseToken)
    putArray("productIds", Arguments.fromList(purchase.products))
    putString("purchaseState", if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) "purchased" else "pending")
  }

  override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
    main.post {
      val promise = pendingPurchase ?: return@post
      val productId = pendingProduct
      pendingPurchase = null
      pendingProduct = null
      if (result.responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
        promise.resolve(Arguments.createMap().apply { putString("status", "cancelled") })
      } else if (result.responseCode == BillingClient.BillingResponseCode.OK) {
        val purchase = purchases?.firstOrNull { it.products.contains(productId) }
        promise.resolve(Arguments.createMap().apply {
          putString("status", if (purchase?.purchaseState == Purchase.PurchaseState.PURCHASED) "success" else "unknown")
          purchase?.let { putMap("payload", purchaseMap(it)) }
        })
      } else promise.reject("billing_failed", "Google Play could not complete the purchase. Check purchase status before trying again.")
    }
  }

  @ReactMethod
  fun restore(promise: Promise) = ready(promise) {
    billing.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build()) { result, purchases ->
      if (result.responseCode != BillingClient.BillingResponseCode.OK) {
        promise.reject("restore_failed", "Could not check Google Play purchases.")
      } else promise.resolve(Arguments.createArray().apply { purchases.forEach { pushMap(purchaseMap(it)) } })
    }
  }

  override fun invalidate() {
    pendingPurchase?.reject("billing_closed", "Purchase status will be checked when you reopen the app.")
    pendingPurchase = null
    waiting.forEach { it.first.reject("billing_closed", "Billing closed.") }
    waiting.clear()
    billing.endConnection()
    super.invalidate()
  }
}
