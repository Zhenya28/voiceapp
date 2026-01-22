// ==========================================
// KONFIGURACJA I ZMIENNE GLOBALNE
// ==========================================

const APP_CONFIG = {
  dbName: "voicenotes-db",
  storeName: "notes",
};

// Stan aplikacji
let currentNoteId = null;
let recognition = null;
let isRecording = false;
let notes = [];

// ==========================================
// ELEMENTY DOM
// ==========================================

const DOM = {
  // Widoki
  viewList: document.getElementById("view-list"),
  viewRecord: document.getElementById("view-record"),
  viewDetail: document.getElementById("view-detail"),

  // Lista notatek
  notesList: document.getElementById("notes-list"),
  emptyState: document.getElementById("empty-state"),
  searchInput: document.getElementById("search-input"),

  // Nagrywanie
  btnAddNote: document.getElementById("btn-add-note"),
  btnBackRecord: document.getElementById("btn-back-record"),
  btnRecord: document.getElementById("btn-record"),
  btnSaveNote: document.getElementById("btn-save-note"),
  recordIndicator: document.getElementById("record-indicator"),
  recordStatus: document.getElementById("record-status"),
  transcript: document.getElementById("transcript"),
  noteTitle: document.getElementById("note-title"),

  // Szczegóły
  btnBackDetail: document.getElementById("btn-back-detail"),
  btnUpdateNote: document.getElementById("btn-update-note"),
  btnDeleteNote: document.getElementById("btn-delete-note"),
  detailTitle: document.getElementById("detail-title"),
  detailTitleInput: document.getElementById("detail-title-input"),
  detailContent: document.getElementById("detail-content"),
  detailDate: document.getElementById("detail-date"),

  // UI
  offlineBanner: document.getElementById("offline-banner"),
  toast: document.getElementById("toast"),
  notificationModal: document.getElementById("notification-modal"),
  btnEnableNotifications: document.getElementById("btn-enable-notifications"),
  btnSkipNotifications: document.getElementById("btn-skip-notifications"),
};

// ==========================================
// INICJALIZACJA APLIKACJI
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("🎤 VoiceNotes PWA - Inicjalizacja");

  // Rejestracja Service Worker dla trybu off-line
  registerServiceWorker();

  // Wczytaj notatki z localStorage
  loadNotes();

  // Inicjalizacja rozpoznawania mowy
  initSpeechRecognition();

  // podpina obsługę kliknięć
  setupEventListeners();

  // Sprawdź status online/offline
  updateOnlineStatus();

  // Sprawdź powiadomienia
  checkNotificationPermission();
});

// ==========================================
// SERVICE WORKER
// ==========================================

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js");
      console.log("Service Worker zarejestrowany:", registration.scope);
    } catch (error) {
      console.error("Błąd rejestracji Service Worker:", error);
    }
  }
}

// ==========================================
// ROZPOZNAWANIE MOWY (Web Speech API)
// ==========================================

function initSpeechRecognition() {
  // Sprawdź wsparcie
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("Przeglądarka nie wspiera Speech Recognition");
    DOM.btnRecord.innerHTML =
      '<span class="btn-record-text">Tylko tekst</span>';
    DOM.recordStatus.textContent =
      "Twoja przeglądarka nie wspiera rozpoznawania mowy. Możesz wpisać tekst ręcznie.";
    return;
  }

  recognition = new SpeechRecognition();

  // Konfiguracja
  recognition.lang = "pl-PL"; // Język polski
  recognition.continuous = true; // Ciągłe nasłuchiwanie
  recognition.interimResults = true; // Wyniki tymczasowe

  // Event: Wynik rozpoznawania
  recognition.onresult = (event) => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
      } else {
        interimTranscript += transcript;
      }
    }

    // Aktualizuj pole tekstowe
    if (finalTranscript) {
      DOM.transcript.value += finalTranscript;
    }

    // Aktualizuj status
    if (interimTranscript) {
      DOM.recordStatus.textContent = `Słyszę: "${interimTranscript}"`;
    }

    // Włącz przycisk zapisu
    updateSaveButton();
  };

  // Event: Błąd
  recognition.onerror = (event) => {
    console.error("Błąd rozpoznawania:", event.error);

    if (event.error === "not-allowed") {
      DOM.recordStatus.textContent =
        "Brak dostępu do mikrofonu. Sprawdź uprawnienia.";
      showToast("Brak dostępu do mikrofonu!");
    } else if (event.error === "no-speech") {
      DOM.recordStatus.textContent = "Nie wykryto mowy. Spróbuj ponownie.";
    } else {
      DOM.recordStatus.textContent = `Błąd: ${event.error}`;
    }

    stopRecording();
  };

  // Event: Koniec
  recognition.onend = () => {
    if (isRecording) {
      // Restart jeśli nadal nagrywamy
      recognition.start();
    }
  };

  console.log("Speech Recognition zainicjalizowane");
}

function startRecording() {
  if (!recognition) {
    showToast("Rozpoznawanie mowy niedostępne");
    return;
  }

  try {
    recognition.start();
    isRecording = true;

    // Aktualizuj UI
    DOM.recordIndicator.classList.add("recording");
    DOM.btnRecord.classList.add("recording");
    DOM.btnRecord.innerHTML = '<span class="btn-record-text">Zatrzymaj</span>';
    DOM.recordStatus.textContent = "Słucham... Mów teraz!";

    console.log("Nagrywanie rozpoczęte");
  } catch (error) {
    console.error("Błąd startu nagrywania:", error);
  }
}

function stopRecording() {
  if (recognition) {
    recognition.stop();
  }

  isRecording = false;

  // Aktualizuj UI
  DOM.recordIndicator.classList.remove("recording");
  DOM.btnRecord.classList.remove("recording");
  DOM.btnRecord.innerHTML = '<span class="btn-record-text">Rozpocznij</span>';
  DOM.recordStatus.textContent = "Kliknij mikrofon, aby kontynuować dyktowanie";

  console.log("Nagrywanie zatrzymane");
}

function toggleRecording() {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

// ==========================================
// POWIADOMIENIA (Notifications API)
// ==========================================

function checkNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("Przeglądarka nie wspiera powiadomień");
    return;
  }

  // Jeśli jeszcze nie pytaliśmy
  if (Notification.permission === "default") {
    // Pokaż modal po chwili
    setTimeout(() => {
      DOM.notificationModal.classList.remove("hidden");
    }, 2000);
  }
}

async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Powiadomienia włączone");
      showToast("Powiadomienia włączone!");

      // Wyślij testowe powiadomienie
      showNotification("VoiceNotes", "Powiadomienia są teraz aktywne!");
    } else {
      console.log("Powiadomienia odrzucone");
    }
  } catch (error) {
    console.error("Błąd uprawnień powiadomień:", error);
  }

  DOM.notificationModal.classList.add("hidden");
}

function showNotification(title, body, options = {}) {
  if (Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    body: body,
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    vibrate: [200, 100, 200],
    ...options,
  });

  // Zamknij po 5 sekundach
  setTimeout(() => notification.close(), 5000);

  return notification;
}

// ==========================================
// ZARZĄDZANIE NOTATKAMI (localStorage)
// ==========================================

function loadNotes() {
  const stored = localStorage.getItem("voicenotes");
  notes = stored ? JSON.parse(stored) : [];
  renderNotesList();
}

function saveNotesToStorage() {
  localStorage.setItem("voicenotes", JSON.stringify(notes));
}

function createNote(title, content) {
  const note = {
    id: Date.now().toString(),
    title: title || "Notatka bez tytułu",
    content: content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  notes.unshift(note); // Dodaj na początek
  saveNotesToStorage();
  renderNotesList();

  // Powiadomienie
  if (Notification.permission === "granted") {
    showNotification("Notatka zapisana!", title || "Nowa notatka");
  }

  return note;
}

function updateNote(id, title, content) {
  const index = notes.findIndex((n) => n.id === id);

  if (index !== -1) {
    notes[index].title = title;
    notes[index].content = content;
    notes[index].updatedAt = new Date().toISOString();
    saveNotesToStorage();
    renderNotesList();
  }
}

function deleteNote(id) {
  notes = notes.filter((n) => n.id !== id);
  saveNotesToStorage();
  renderNotesList();
}

function getNoteById(id) {
  return notes.find((n) => n.id === id);
}

// ==========================================
// RENDEROWANIE UI
// ==========================================

function renderNotesList(searchQuery = "") {
  const filteredNotes = searchQuery
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : notes;

  // Pokaż/ukryj empty state
  if (filteredNotes.length === 0) {
    DOM.notesList.innerHTML = "";
    DOM.emptyState.classList.remove("hidden");
  } else {
    DOM.emptyState.classList.add("hidden");

    DOM.notesList.innerHTML = filteredNotes
      .map(
        (note) => `
            <article class="note-card" data-id="${note.id}">
                <h3 class="note-card-title">${escapeHtml(note.title)}</h3>
                <p class="note-card-preview">${escapeHtml(note.content)}</p>
                <time class="note-card-date">${formatDate(
                  note.createdAt,
                )}</time>
            </article>
        `,
      )
      .join("");

    // Dodaj event listeners
    DOM.notesList.querySelectorAll(".note-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        openNoteDetail(id);
      });
    });
  }
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ==========================================
// NAWIGACJA MIĘDZY WIDOKAMI
// ==========================================

function showView(viewName) {
  // Ukryj wszystkie widoki
  document
    .querySelectorAll(".view")
    .forEach((v) => v.classList.remove("active"));

  // Pokaż wybrany widok
  const view = document.getElementById(`view-${viewName}`);
  if (view) {
    view.classList.add("active");
  }

  // Zatrzymaj nagrywanie przy zmianie widoku
  if (viewName !== "record" && isRecording) {
    stopRecording();
  }
}

function openRecordView() {
  // Reset formularza
  DOM.transcript.value = "";
  DOM.noteTitle.value = "";
  updateSaveButton();

  showView("record");
}

function openNoteDetail(id) {
  const note = getNoteById(id);

  if (!note) {
    showToast("Nie znaleziono notatki");
    return;
  }

  currentNoteId = id;

  // Wypełnij formularz
  DOM.detailTitle.textContent = note.title;
  DOM.detailTitleInput.value = note.title;
  DOM.detailContent.value = note.content;
  DOM.detailDate.textContent = formatDate(note.createdAt);

  showView("detail");
}

function goToList() {
  currentNoteId = null;
  showView("list");
}

// ==========================================
// OBSŁUGA FORMULARZY
// ==========================================

function updateSaveButton() {
  const hasContent = DOM.transcript.value.trim().length > 0;
  DOM.btnSaveNote.disabled = !hasContent;
}

function saveNewNote() {
  const title = DOM.noteTitle.value.trim();
  const content = DOM.transcript.value.trim();

  if (!content) {
    showToast("Wpisz treść notatki");
    return;
  }

  createNote(title, content);
  showToast("Notatka zapisana!");
  goToList();
}

function updateCurrentNote() {
  if (!currentNoteId) return;

  const title = DOM.detailTitleInput.value.trim();
  const content = DOM.detailContent.value.trim();

  if (!content) {
    showToast("Treść nie może być pusta");
    return;
  }

  updateNote(currentNoteId, title || "Notatka bez tytułu", content);
  showToast("Zmiany zapisane!");
  goToList();
}

function deleteCurrentNote() {
  if (!currentNoteId) return;

  if (confirm("Czy na pewno chcesz usunąć tę notatkę?")) {
    deleteNote(currentNoteId);
    showToast("Notatka usunięta");
    goToList();
  }
}

// ==========================================
// STATUS ONLINE/OFFLINE
// ==========================================

function updateOnlineStatus() {
  if (navigator.onLine) {
    DOM.offlineBanner.classList.add("hidden");
  } else {
    DOM.offlineBanner.classList.remove("hidden");
  }
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

function showToast(message, duration = 3000) {
  DOM.toast.textContent = message;
  DOM.toast.classList.remove("hidden");

  setTimeout(() => {
    DOM.toast.classList.add("hidden");
  }, duration);
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function setupEventListeners() {
  // Nawigacja
  DOM.btnAddNote.addEventListener("click", openRecordView);
  DOM.btnBackRecord.addEventListener("click", goToList);
  DOM.btnBackDetail.addEventListener("click", goToList);

  // Nagrywanie
  DOM.btnRecord.addEventListener("click", toggleRecording);
  DOM.transcript.addEventListener("input", updateSaveButton);
  DOM.btnSaveNote.addEventListener("click", saveNewNote);

  // Szczegóły notatki
  DOM.btnUpdateNote.addEventListener("click", updateCurrentNote);
  DOM.btnDeleteNote.addEventListener("click", deleteCurrentNote);

  // Wyszukiwanie
  DOM.searchInput.addEventListener("input", (e) => {
    renderNotesList(e.target.value);
  });

  // Powiadomienia
  DOM.btnEnableNotifications.addEventListener(
    "click",
    requestNotificationPermission,
  );
  DOM.btnSkipNotifications.addEventListener("click", () => {
    DOM.notificationModal.classList.add("hidden");
  });

  // Status online/offline
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  // Klawiatura - Enter zapisuje notatkę
  DOM.noteTitle.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      DOM.transcript.focus();
    }
  });
}
