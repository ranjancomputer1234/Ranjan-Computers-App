package com.rediapp.learner

import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

class RediGoogleAuthModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  private val credentials = CredentialManager.create(context)
  private val executor = Executors.newSingleThreadExecutor { runnable ->
    Thread(runnable, "redi-google-auth").apply { isDaemon = true }
  }
  private val busy = AtomicBoolean(false)

  override fun getName() = "RaciGoogleAuth"

  @ReactMethod
  fun signIn(promise: Promise) {
    val activity = context.currentActivity
    val clientId = BuildConfig.REDI_GOOGLE_WEB_CLIENT_ID.trim()
    if (clientId.isEmpty()) {
      promise.reject(
        "google_not_configured",
        "Google sign-in needs a Google client ID in this build. Continue with email or mobile number until the institute connects it.",
      )
      return
    }
    if (activity == null) {
      promise.reject("google_unavailable", "Google sign-in needs the app to be open.")
      return
    }
    val playServices = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(activity)
    if (playServices != ConnectionResult.SUCCESS) {
      promise.reject(
        "google_unavailable",
        "Google Play services are required for Google sign-in. Continue with email or mobile number.",
      )
      return
    }
    if (!busy.compareAndSet(false, true)) {
      promise.reject("google_busy", "Google sign-in is already open.")
      return
    }
    try {
      val option = GetSignInWithGoogleOption.Builder(clientId).build()
      val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
      credentials.getCredentialAsync(
        activity,
        request,
        null,
        executor,
        object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
          override fun onResult(result: GetCredentialResponse) {
            busy.set(false)
            deliver(promise, result)
          }

          override fun onError(e: GetCredentialException) {
            busy.set(false)
            when {
              cancelled(e) ->
                promise.reject("google_cancelled", "Google sign-in was cancelled.")
              e is NoCredentialException ->
                promise.reject(
                  "google_unavailable",
                  "Google sign-in is not available on this device. Continue with email or mobile number.",
                )
              else ->
                promise.reject(
                  "google_failed",
                  "Google sign-in could not be completed. Continue with email or mobile number.",
                )
            }
          }
        },
      )
    } catch (_: Exception) {
      busy.set(false)
      promise.reject(
        "google_failed",
        "Google sign-in could not be completed. Continue with email or mobile number.",
      )
    }
  }

  @ReactMethod
  fun signOut(promise: Promise) {
    try {
      credentials.clearCredentialStateAsync(
        ClearCredentialStateRequest(),
        null,
        executor,
        object : CredentialManagerCallback<Void?, ClearCredentialException> {
          override fun onResult(result: Void?) {
            promise.resolve(null)
          }

          override fun onError(e: ClearCredentialException) {
            promise.resolve(null)
          }
        },
      )
    } catch (_: Exception) {
      promise.resolve(null)
    }
  }

  private fun deliver(promise: Promise, result: GetCredentialResponse) {
    val credential = result.credential
    if (
      credential !is CustomCredential ||
      credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
    ) {
      promise.reject("google_token_missing", "Google did not return a sign-in token.")
      return
    }
    try {
      val account = GoogleIdTokenCredential.createFrom(credential.data)
      val token = account.idToken.trim()
      if (token.isEmpty()) {
        promise.reject("google_token_missing", "Google did not return a sign-in token.")
        return
      }
      val name = account.displayName?.trim()?.takeIf { it.isNotEmpty() }
        ?: listOfNotNull(account.givenName, account.familyName)
          .map { it.trim() }
          .filter { it.isNotEmpty() }
          .joinToString(" ")
          .takeIf { it.isNotEmpty() }
      promise.resolve(Arguments.createMap().apply {
        putString("idToken", token)
        putString("email", account.email)
        putString("name", name)
      })
    } catch (_: Exception) {
      promise.reject(
        "google_failed",
        "Google sign-in could not be completed. Continue with email or mobile number.",
      )
    }
  }

  private fun cancelled(error: GetCredentialException): Boolean {
    if (error is GetCredentialCancellationException) return true
    return error.type.contains("cancel", ignoreCase = true)
  }
}
