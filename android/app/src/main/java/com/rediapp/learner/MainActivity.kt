package com.rediapp.learner

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    preferHighestRefreshRate()
  }

  override fun onResume() {
    super.onResume()
    // Re-apply after returning from a system surface or another app because
    // some Android vendors reset the preferred display mode while paused.
    preferHighestRefreshRate()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    RediNotificationsModule.handleNotificationIntent(intent)
  }

  @Suppress("DEPRECATION")
  private fun preferHighestRefreshRate() {
    val display = windowManager.defaultDisplay
    val currentMode = display.mode
    val bestMode = display.supportedModes
      .asSequence()
      .filter {
        it.physicalWidth == currentMode.physicalWidth &&
          it.physicalHeight == currentMode.physicalHeight
      }
      .maxByOrNull { it.refreshRate }
      ?: return

    if (window.attributes.preferredDisplayModeId != bestMode.modeId) {
      window.attributes = window.attributes.apply {
        preferredDisplayModeId = bestMode.modeId
      }
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "REDIApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
