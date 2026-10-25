package com.rediapp.learner

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    // When REDI_USE_EMBEDDED_JS is true, skip Metro so the emulator does not hang on
    // "Downloading 100%" after a corrupted chunked/multipart bundle response on Windows.
    val useDevSupport = BuildConfig.DEBUG && !BuildConfig.REDI_USE_EMBEDDED_JS
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(RediPackage())
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
      useDevSupport = useDevSupport,
    )
  }

  override fun onCreate() {
    super.onCreate()
    RediNotificationsModule.createChannels(this)
    loadReactNative(this)
  }
}
