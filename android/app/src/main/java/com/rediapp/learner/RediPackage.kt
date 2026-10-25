package com.rediapp.learner

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.uimanager.ViewManager

class RediBuildConfigModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "RediBuildConfig"
  override fun getConstants(): MutableMap<String, Any> = mutableMapOf(
    "debugBuild" to BuildConfig.DEBUG,
    "apiBaseUrl" to BuildConfig.REDI_API_BASE_URL,
    "privacyPolicyUrl" to BuildConfig.REDI_PRIVACY_POLICY_URL,
    "accountDeletionUrl" to BuildConfig.REDI_ACCOUNT_DELETION_URL,
    "googleWebClientId" to BuildConfig.REDI_GOOGLE_WEB_CLIENT_ID,
    "firebaseEnabled" to BuildConfig.REDI_FIREBASE_ENABLED,
    "versionName" to BuildConfig.VERSION_NAME,
    "timeoutMs" to BuildConfig.REDI_TIMEOUT_MS,
    "seedRiyaEmail" to BuildConfig.REDI_SEED_RIYA_EMAIL,
    "seedRiyaPassword" to BuildConfig.REDI_SEED_RIYA_PASSWORD,
    "seedArjunEmail" to BuildConfig.REDI_SEED_ARJUN_EMAIL,
    "seedArjunPassword" to BuildConfig.REDI_SEED_ARJUN_PASSWORD,
  )
}

class RediPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(
      RediBuildConfigModule(context),
      RediBillingModule(context),
      RediReminderModule(context),
      RediNotificationsModule(context),
      RediPdfModule(context),
    )
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
