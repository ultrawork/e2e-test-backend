package com.ultrawork.notes.data.remote

import com.google.gson.annotations.SerializedName

/**
 * DTO matching the backend API contract for a note resource.
 */
data class NoteDto(
    val id: String,
    val title: String,
    val content: String,
    @SerializedName("userId") val userId: String,
    @SerializedName("createdAt") val createdAt: String?,
    @SerializedName("updatedAt") val updatedAt: String?
)

/**
 * Request body for POST /api/notes.
 */
data class CreateNoteRequest(
    val title: String,
    val content: String
)
