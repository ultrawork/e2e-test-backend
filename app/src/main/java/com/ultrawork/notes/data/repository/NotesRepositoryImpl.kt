package com.ultrawork.notes.data.repository

import com.ultrawork.notes.data.remote.ApiService
import com.ultrawork.notes.data.remote.CreateNoteRequest
import com.ultrawork.notes.data.remote.NoteDto
import com.ultrawork.notes.model.Note
import javax.inject.Inject

/**
 * Implementation of NotesRepository backed by Retrofit ApiService.
 * Uses runCatching to wrap all network calls in Result.
 */
class NotesRepositoryImpl @Inject constructor(
    private val apiService: ApiService
) : NotesRepository {

    override suspend fun getNotes(): Result<List<Note>> = runCatching {
        apiService.getNotes().map { it.toDomain() }
    }

    override suspend fun createNote(title: String): Result<Note> = runCatching {
        val request = CreateNoteRequest(title = title, content = title)
        apiService.createNote(request).toDomain()
    }

    override suspend fun deleteNote(id: String): Result<Unit> = runCatching {
        apiService.deleteNote(id)
    }
}

/** Maps NoteDto (transport layer) to Note (domain layer). */
private fun NoteDto.toDomain(): Note = Note(
    id = id,
    title = title,
    content = content,
    userId = userId,
    createdAt = createdAt,
    updatedAt = updatedAt
)
