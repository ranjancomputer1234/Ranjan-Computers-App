package com.rediapp.learner

import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.pdf.PdfRenderer
import android.os.ParcelFileDescriptor
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.io.FileOutputStream

/** Renders one page of an app-private PDF. The bitmap never leaves app cache. */
class RediPdfModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "RediPdf"

  @ReactMethod
  fun renderPage(path: String, index: Int, promise: Promise) {
    try {
      val file = File(path)
      if (!file.isFile) {
        promise.reject("pdf", "The PDF is not in app storage.")
        return
      }
      ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY).use { descriptor ->
        PdfRenderer(descriptor).use { renderer ->
          if (index < 0 || index >= renderer.pageCount) {
            promise.reject("pdf", "That page is not in this document.")
            return
          }
          renderer.openPage(index).use { page ->
            val width = page.width.coerceAtLeast(1)
            val scale = (1440f / width).coerceIn(1f, 2.5f)
            val bitmap = Bitmap.createBitmap(
              (width * scale).toInt(),
              (page.height.coerceAtLeast(1) * scale).toInt(),
              Bitmap.Config.ARGB_8888,
            )
            bitmap.eraseColor(Color.WHITE)
            page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
            val output = File(reactApplicationContext.cacheDir, "redi-pdf-page-$index.png")
            FileOutputStream(output).use { stream ->
              bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
            }
            bitmap.recycle()
            val result = Arguments.createMap()
            result.putString("path", output.absolutePath)
            result.putInt("pageCount", renderer.pageCount)
            result.putInt("index", index)
            promise.resolve(result)
          }
        }
      }
    } catch (error: Exception) {
      promise.reject("pdf", error.message, error)
    }
  }
}
