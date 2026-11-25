package com.rediapp.learner

import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Address
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.CancellationSignal
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import java.security.MessageDigest
import java.util.Locale
import java.util.concurrent.Executors

class RediLocationModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val executor = Executors.newSingleThreadExecutor()
  private val geocoderLocale = Locale.forLanguageTag("en-IN")

  override fun getName() = "RaciLocation"

  @SuppressLint("MissingPermission")
  @ReactMethod
  fun currentCoordinates(promise: Promise) {
    requestLocation(
      onLocation = { location ->
        if (location == null) promise.reject("location_unavailable", "Your location could not be read. Type your address instead.")
        else promise.resolve(Arguments.createMap().apply {
          putDouble("latitude", location.latitude)
          putDouble("longitude", location.longitude)
        })
      },
      onSecurity = { promise.reject("location_permission_denied", "Location permission is off. You can still type your address.") },
    )
  }

  @SuppressLint("MissingPermission")
  @ReactMethod
  fun currentAddress(promise: Promise) {
    requestLocation(
      onLocation = { location ->
        if (location == null) promise.reject("location_unavailable", "Your location could not be read. Type your address instead.")
        else resolveAddress(location, promise)
      },
      onSecurity = { promise.reject("location_permission_denied", "Location permission is off. You can still type your address.") },
    )
  }

  @ReactMethod
  fun searchPlaces(query: String, promise: Promise) {
    val trimmed = query.trim()
    if (trimmed.length < 2) {
      promise.resolve(Arguments.createArray())
      return
    }
    executor.execute {
      try {
        val geocoder = Geocoder(context, geocoderLocale)
        val results = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          val found = java.util.concurrent.CompletableFuture<List<Address>>()
          geocoder.getFromLocationName(trimmed, 5) { found.complete(it) }
          found.get(8, java.util.concurrent.TimeUnit.SECONDS)
        } else {
          @Suppress("DEPRECATION")
          geocoder.getFromLocationName(trimmed, 5) ?: emptyList()
        }
        val array = Arguments.createArray()
        results.orEmpty().forEach { array.pushMap(addressMap(it)) }
        promise.resolve(array)
      } catch (_: Exception) {
        promise.resolve(Arguments.createArray())
      }
    }
  }

  @ReactMethod
  fun mapsIdentity(promise: Promise) {
    promise.resolve(Arguments.createMap().apply {
      putString("packageName", context.packageName)
      putString("certSha1", signingSha1())
    })
  }

  @SuppressLint("MissingPermission")
  private fun requestLocation(onLocation: (Location?) -> Unit, onSecurity: () -> Unit) {
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    val provider = when {
      manager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
      manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
      else -> null
    }
    val last = lastKnown(manager)
    if (provider == null) {
      onLocation(last)
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      try {
        manager.getCurrentLocation(provider, CancellationSignal(), context.mainExecutor) { location ->
          onLocation(location ?: last)
        }
      } catch (_: SecurityException) {
        onSecurity()
      }
      return
    }
    onLocation(last)
  }

  @SuppressLint("MissingPermission")
  private fun lastKnown(manager: LocationManager): Location? {
    return listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER)
      .mapNotNull { provider ->
        try {
          manager.getLastKnownLocation(provider)
        } catch (_: Exception) {
          null
        }
      }
      .maxByOrNull { it.time }
  }

  private fun resolveAddress(location: Location, promise: Promise) {
    executor.execute {
      try {
        val geocoder = Geocoder(context, geocoderLocale)
        val address = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
          val found = java.util.concurrent.CompletableFuture<List<Address>>()
          geocoder.getFromLocation(location.latitude, location.longitude, 1) { found.complete(it) }
          found.get(8, java.util.concurrent.TimeUnit.SECONDS)?.firstOrNull()
        } else {
          @Suppress("DEPRECATION")
          geocoder.getFromLocation(location.latitude, location.longitude, 1)?.firstOrNull()
        }
        if (address == null) {
          promise.resolve(Arguments.createMap().apply {
            putString("id", "${location.latitude},${location.longitude}")
            putString("label", "Current location")
            putDouble("latitude", location.latitude)
            putDouble("longitude", location.longitude)
          })
        } else {
          promise.resolve(addressMap(address))
        }
      } catch (_: Exception) {
        promise.reject("location_unavailable", "Your address could not be read. Type your address instead.")
      }
    }
  }

  private fun addressMap(address: Address): WritableMap {
    val streetNumber = address.subThoroughfare?.trim().orEmpty()
    val route = address.thoroughfare?.trim().orEmpty()
    val line1 = listOf(streetNumber, route).filter { it.isNotEmpty() }.distinct().joinToString(" ")
    val line2 = address.subLocality?.trim().orEmpty()
    val city = listOf(address.locality, address.subAdminArea)
      .firstOrNull { !it.isNullOrBlank() }
      ?.trim()
      .orEmpty()
    val state = address.adminArea?.trim().orEmpty()
    val pincode = address.postalCode?.trim().orEmpty()
    val label = listOf(line1, line2, city, state, pincode)
      .filter { it.isNotEmpty() }
      .distinct()
      .joinToString(", ")
    return Arguments.createMap().apply {
      putString("id", "${address.latitude},${address.longitude}")
      putString("label", label.ifBlank { city.ifBlank { "Current location" } })
      putString("addressLine1", line1)
      putString("addressLine2", line2)
      putString("city", city.take(100))
      putString("state", state)
      putString("pincode", pincode)
      putDouble("latitude", address.latitude)
      putDouble("longitude", address.longitude)
    }
  }

  private fun signingSha1(): String {
    return try {
      val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        val info = context.packageManager.getPackageInfo(
          context.packageName,
          PackageManager.GET_SIGNING_CERTIFICATES,
        )
        info.signingInfo?.apkContentsSigners ?: emptyArray()
      } else {
        @Suppress("DEPRECATION")
        val info = context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_SIGNATURES)
        @Suppress("DEPRECATION")
        info.signatures ?: emptyArray()
      }
      val cert = signatures.firstOrNull() ?: return ""
      val digest = MessageDigest.getInstance("SHA-1").digest(cert.toByteArray())
      digest.joinToString("") { byte -> "%02x".format(byte) }
    } catch (_: Exception) {
      ""
    }
  }
}
