package com.ultrawork.notes.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ultrawork.notes.data.repository.NotesRepository
import com.ultrawork.notes.model.Note
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel exposing notes data, loading status, and errors via StateFlow.
 * Delegates all data operations to NotesRepository.
 */
@HiltViewModel
class NotesViewModel @Inject constructor(
    private val repository: NotesRepository
) : ViewModel() {

    private val _notes = MutableStateFlow<List<Note>>(emptyList())
    val notes: StateFlow<List<Note>> = _notes.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadNotes()
    }

    /** Loads all notes from the repository. */
    fun loadNotes() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            repository.getNotes()
                .onSuccess { _notes.value = it }
                .onFailure { _error.value = it.message }
            _isLoading.value = false
        }
    }

    /** Creates a note and reloads the list on success. */
    fun createNote(title: String, content: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            repository.createNote(title, content)
                .onSuccess { loadNotes() }
                .onFailure {
                    _error.value = it.message
                    _isLoading.value = false
                }
        }
    }

    /** Deletes a note by id and removes it from the list on success. */
    fun deleteNote(id: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            repository.deleteNote(id)
                .onSuccess {
                    _notes.value = _notes.value.filter { it.id != id }
                    _isLoading.value = false
                }
                .onFailure {
                    _error.value = it.message
                    _isLoading.value = false
                }
        }
    }
}
