package com.rediapp.learner

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class RediBuildConfigModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "RaciBuildConfig"
  override fun getConstants(): MutableMap<String, Any> = mutableMapOf(
    "debugBuild" to BuildConfig.DEBUG,
    "apiBaseUrl" to BuildConfig.REDI_API_BASE_URL,
    "privacyPolicyUrl" to BuildConfig.REDI_PRIVACY_POLICY_URL,
    "accountDeletionUrl" to BuildConfig.REDI_ACCOUNT_DELETION_URL,
    "googleWebClientId" to BuildConfig.REDI_GOOGLE_WEB_CLIENT_ID,
    "googleMapsApiKey" to BuildConfig.REDI_GOOGLE_MAPS_API_KEY,
    "firebaseEnabled" to BuildConfig.REDI_FIREBASE_ENABLED,
    "versionName" to BuildConfig.VERSION_NAME,
    "timeoutMs" to BuildConfig.REDI_TIMEOUT_MS,
    "seedRiyaEmail" to BuildConfig.REDI_SEED_RIYA_EMAIL,
    "seedRiyaPassword" to BuildConfig.REDI_SEED_RIYA_PASSWORD,
    "seedArjunEmail" to BuildConfig.REDI_SEED_ARJUN_EMAIL,
    "seedArjunPassword" to BuildConfig.REDI_SEED_ARJUN_PASSWORD,
  )
}

class RediPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    when (name) {
      "RaciBuildConfig" -> RediBuildConfigModule(reactContext)
      "RaciBilling" -> RediBillingModule(reactContext)
      "RaciReminders" -> RediReminderModule(reactContext)
      "RaciNotifications" -> RediNotificationsModule(reactContext)
      "RaciPdf" -> RediPdfModule(reactContext)
      "RaciGoogleAuth" -> RediGoogleAuthModule(reactContext)
      "RaciLocation" -> RediLocationModule(reactContext)
      else -> null
    }

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    listOf(
      "RaciBuildConfig" to "RediBuildConfigModule",
      "RaciBilling" to "RediBillingModule",
      "RaciReminders" to "RediReminderModule",
      "RaciNotifications" to "RediNotificationsModule",
      "RaciPdf" to "RediPdfModule",
      "RaciGoogleAuth" to "RediGoogleAuthModule",
      "RaciLocation" to "RediLocationModule",
    ).associate { (name, className) ->
      name to ReactModuleInfo(
        name = name,
        className = className,
        canOverrideExistingModule = false,
        needsEagerInit = true,
        isCxxModule = false,
        isTurboModule = false,
      )
    }
  }
}
