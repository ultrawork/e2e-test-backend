package com.ultrawork.notes.data.remote

import android.content.SharedPreferences
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

/**
 * OkHttp interceptor that adds Authorization: Bearer <JWT> header
 * to every outgoing HTTP request when a token is present in SharedPreferences.
 */
class AuthInterceptor @Inject constructor(
    private val sharedPreferences: SharedPreferences
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val token = sharedPreferences.getString("auth_token", null)

        val request = if (!token.isNullOrBlank()) {
            originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            originalRequest
        }

        return chain.proceed(request)
    }
}
