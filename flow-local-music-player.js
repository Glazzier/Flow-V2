// Variables globales
let currentSongIndex = 0;
let isPlaying = false;

// Función para manejar la subida de archivos
function handleFileUpload(event) {
  const files = event.target.files;
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type.startsWith("audio/")) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const song = {
          name: file.name,
          data: e.target.result,
        };
        saveSong(song);
        updateSongList();
      };
      reader.readAsDataURL(file);
    } else {
      console.warn(
        "El archivo",
        file.name,
        "no es un archivo de audio válido."
      );
    }
  }
}

// Función para guardar una canción en el almacenamiento local
function saveSong(song) {
  let songs = JSON.parse(localStorage.getItem("songs") || "[]");
  songs.push(song);
  localStorage.setItem("songs", JSON.stringify(songs));
}

// Función para actualizar la lista de canciones en la interfaz
function updateSongList() {
  const songs = JSON.parse(localStorage.getItem("songs") || "[]");
  const songList = document.getElementById("songList");
  songList.innerHTML = "";
  songs.forEach((song, index) => {
    const li = document.createElement("li");
    const songTitle = document.createElement("span");
    songTitle.textContent = song.name;
    songTitle.className = "song-title";
    li.appendChild(songTitle);

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSong(index);
    };
    li.appendChild(deleteBtn);

    li.onclick = () => playSong(index);
    li.className = "fade-in";
    songList.appendChild(li);
  });
}

// Función para eliminar una canción
function deleteSong(index) {
  let songs = JSON.parse(localStorage.getItem("songs") || "[]");
  songs.splice(index, 1);
  localStorage.setItem("songs", JSON.stringify(songs));
  updateSongList();
  if (index === currentSongIndex) {
    stopPlayback();
  } else if (index < currentSongIndex) {
    currentSongIndex--;
  }
}

// Función para reproducir una canción
function playSong(index) {
  const songs = JSON.parse(localStorage.getItem("songs") || "[]");
  if (index >= 0 && index < songs.length) {
    currentSongIndex = index;
    const song = songs[index];
    const audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.src = song.data;
    audioPlayer.play();
    isPlaying = true;
    updatePlayPauseButton();
    document.getElementById(
      "nowPlaying"
    ).textContent = `Reproduciendo: ${song.name}`;
    highlightCurrentSong();
  }
}

// Función para resaltar la canción actual
function highlightCurrentSong() {
  const songItems = document.querySelectorAll("#songList li");
  songItems.forEach((item, i) => {
    if (i === currentSongIndex) {
      item.style.backgroundColor = "rgba(90, 185, 234, 0.3)";
      item.style.fontWeight = "bold";
    } else {
      item.style.backgroundColor = "";
      item.style.fontWeight = "normal";
    }
  });
}

// Función para actualizar el botón de reproducción/pausa
function updatePlayPauseButton() {
  const playPauseBtn = document.getElementById("playPauseBtn");
  playPauseBtn.innerHTML = isPlaying
    ? '<i class="fas fa-pause"></i>'
    : '<i class="fas fa-play"></i>';
}

// Función para reproducir/pausar
function togglePlayPause() {
  const audioPlayer = document.getElementById("audioPlayer");
  if (isPlaying) {
    audioPlayer.pause();
  } else {
    audioPlayer.play();
  }
  isPlaying = !isPlaying;
  updatePlayPauseButton();
}

// Función para reproducir la siguiente canción
function playNextSong() {
  const songs = JSON.parse(localStorage.getItem("songs") || "[]");
  if (songs.length > 0) {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong(currentSongIndex);
  }
}

// Función para reproducir la canción anterior
function playPreviousSong() {
  const songs = JSON.parse(localStorage.getItem("songs") || "[]");
  if (songs.length > 0) {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(currentSongIndex);
  }
}

// Función para detener la reproducción
function stopPlayback() {
  const audioPlayer = document.getElementById("audioPlayer");
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  isPlaying = false;
  updatePlayPauseButton();
  document.getElementById("nowPlaying").textContent = "";
  document.getElementById("progressBar").style.width = "0%";
}

// Función para actualizar la barra de progreso
function updateProgressBar() {
  const audioPlayer = document.getElementById("audioPlayer");
  const progressBar = document.getElementById("progressBar");
  const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  progressBar.style.width = `${progress}%`;
}

// Función para cambiar la posición de reproducción
function setPlaybackPosition(e) {
  const progressContainer = document.getElementById("progressContainer");
  const audioPlayer = document.getElementById("audioPlayer");
  const clickPosition =
    (e.clientX - progressContainer.getBoundingClientRect().left) /
    progressContainer.offsetWidth;
  audioPlayer.currentTime = clickPosition * audioPlayer.duration;
}

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", () => {
  updateSongList();
  document
    .getElementById("fileUpload")
    .addEventListener("change", handleFileUpload);
  document
    .getElementById("playPauseBtn")
    .addEventListener("click", togglePlayPause);
  document.getElementById("nextBtn").addEventListener("click", playNextSong);
  document
    .getElementById("prevBtn")
    .addEventListener("click", playPreviousSong);
  document
    .getElementById("progressContainer")
    .addEventListener("click", setPlaybackPosition);

  const audioPlayer = document.getElementById("audioPlayer");
  audioPlayer.addEventListener("ended", playNextSong);
  audioPlayer.addEventListener("timeupdate", updateProgressBar);

  // Efecto de desvanecimiento para los elementos principales
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el, index) => {
    el.style.opacity = "0";
    setTimeout(() => {
      el.style.opacity = "1";
    }, 100 * index);
  });
});

// Función para manejar el arrastre y soltar
function setupDragAndDrop() {
  const dropArea = document.getElementById("drop-area");

  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  function highlight(e) {
    dropArea.classList.add("highlight");
  }

  function unhighlight(e) {
    dropArea.classList.remove("highlight");
  }

  dropArea.addEventListener("drop", handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }

  // También permitimos hacer clic para seleccionar archivos
  dropArea.addEventListener("click", () => {
    document.getElementById("fileUpload").click();
  });
}

// Función para manejar los archivos (ya sea por arrastrar y soltar o selección)
function handleFiles(files) {
  [...files].forEach(uploadFile);
}

// Función para subir un archivo individual
function uploadFile(file) {
  if (file.type.startsWith("audio/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const song = {
        name: file.name,
        data: e.target.result,
      };
      saveSong(song);
      updateSongList();
    };
    reader.readAsDataURL(file);
  } else {
    console.warn("El archivo", file.name, "no es un archivo de audio válido.");
  }
}

// Modificar la función handleFileUpload para usar handleFiles
function handleFileUpload(event) {
  handleFiles(event.target.files);
}

// Modificar la función de inicialización
document.addEventListener("DOMContentLoaded", () => {
  updateSongList();
  document
    .getElementById("fileUpload")
    .addEventListener("change", handleFileUpload);
  setupDragAndDrop();
  document
    .getElementById("playPauseBtn")
    .addEventListener("click", togglePlayPause);
  document.getElementById("nextBtn").addEventListener("click", playNextSong);
  document
    .getElementById("prevBtn")
    .addEventListener("click", playPreviousSong);
  document
    .getElementById("progressContainer")
    .addEventListener("click", setPlaybackPosition);

  const audioPlayer = document.getElementById("audioPlayer");
  audioPlayer.addEventListener("ended", playNextSong);
  audioPlayer.addEventListener("timeupdate", updateProgressBar);

  // Efecto de desvanecimiento para los elementos principales
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el, index) => {
    el.style.opacity = "0";
    setTimeout(() => {
      el.style.opacity = "1";
    }, 100 * index);
  });
});

// Función para realizar la búsqueda
function searchSongs() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const songs = JSON.parse(localStorage.getItem("songs") || "[]");
  const filteredSongs = songs.filter((song) =>
    song.name.toLowerCase().includes(searchTerm)
  );
  updateSongList(filteredSongs);
}

// Modificar la función updateSongList para aceptar un parámetro opcional de canciones filtradas
function updateSongList(filteredSongs) {
  const songs =
    filteredSongs || JSON.parse(localStorage.getItem("songs") || "[]");
  const songList = document.getElementById("songList");
  songList.innerHTML = "";
  songs.forEach((song, index) => {
    const li = document.createElement("li");
    const songTitle = document.createElement("span");
    songTitle.textContent = song.name;
    songTitle.className = "song-title";
    li.appendChild(songTitle);

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSong(index);
    };
    li.appendChild(deleteBtn);

    li.onclick = () => playSong(index);
    li.className = "fade-in";
    songList.appendChild(li);
  });

  if (songs.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No se encontraron canciones";
    li.className = "fade-in";
    songList.appendChild(li);
  }
}

// Modificar la función de inicialización
document.addEventListener("DOMContentLoaded", () => {
  updateSongList();
  document
    .getElementById("fileUpload")
    .addEventListener("change", handleFileUpload);
  setupDragAndDrop();
  document
    .getElementById("playPauseBtn")
    .addEventListener("click", togglePlayPause);
  document.getElementById("nextBtn").addEventListener("click", playNextSong);
  document
    .getElementById("prevBtn")
    .addEventListener("click", playPreviousSong);
  document
    .getElementById("progressContainer")
    .addEventListener("click", setPlaybackPosition);

  // Agregar event listeners para la búsqueda
  document
    .getElementById("searchButton")
    .addEventListener("click", searchSongs);
  document.getElementById("searchInput").addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      searchSongs();
    }
  });

  const audioPlayer = document.getElementById("audioPlayer");
  audioPlayer.addEventListener("ended", playNextSong);
  audioPlayer.addEventListener("timeupdate", updateProgressBar);

  // Efecto de desvanecimiento para los elementos principales
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((el, index) => {
    el.style.opacity = "0";
    setTimeout(() => {
      el.style.opacity = "1";
    }, 100 * index);
  });
});
