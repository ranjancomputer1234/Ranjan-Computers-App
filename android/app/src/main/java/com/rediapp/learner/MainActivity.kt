package com.rediapp.learner

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.Display
import android.view.View
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import kotlin.math.abs

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Ask for the panel rate before React creates the Surface, then again
    // after setContentView so the first buffer queue is not stuck at 60 Hz.
    preferHighestRefreshRate()
    super.onCreate(null)
    preferHighestRefreshRate()
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
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
    val display = windowManager.defaultDisplay ?: return
    val currentMode = display.mode
    val supported = display.supportedModes
    if (supported.isEmpty()) return

    val sameSize = supported.filter { mode ->
      abs(mode.physicalWidth - currentMode.physicalWidth) <= 8 &&
        abs(mode.physicalHeight - currentMode.physicalHeight) <= 8
    }
    val bestMode = (if (sameSize.isNotEmpty()) sameSize else supported.asList())
      .maxByOrNull(Display.Mode::getRefreshRate)
      ?: return

    val params = window.attributes
    val modeChanged = params.preferredDisplayModeId != bestMode.modeId
    val rateChanged = params.preferredRefreshRate < bestMode.refreshRate
    if (modeChanged || rateChanged) {
      params.preferredDisplayModeId = bestMode.modeId
      params.preferredRefreshRate = bestMode.refreshRate
      window.attributes = params
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      window.peekDecorView()?.setRequestedFrameRate(View.REQUESTED_FRAME_RATE_CATEGORY_HIGH)
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
