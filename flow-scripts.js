// Variables globales
let currentSongIndex = 0;
let isPlaying = false;
let songsData = []; // Variable para almacenar las canciones cargadas

// Función para cargar canciones desde el archivo JSON
async function loadSongs() {
  try {
    const response = await fetch("songs.json");
    const data = await response.json();
    songsData = data.songs; // Guardamos las canciones en la variable global songsData
    return songsData;
  } catch (error) {
    console.error("Error fetching songs:", error);
    return [];
  }
}

// Función para actualizar la lista de canciones en la interfaz
function updateSongList(songs, containerId = "songList") {
  const songList = document.getElementById(containerId);
  songList.innerHTML = "";

  songs.forEach((song, index) => {
    const li = document.createElement("li");
    li.className = "song-item fade-in";
    li.onclick = () => playSong(index);

    const coverArt = document.createElement("div");
    coverArt.className = "cover-art";
    if (song.cover) {
      coverArt.style.backgroundImage = `url(${song.cover})`;
    } else {
      coverArt.innerHTML = '<i class="fas fa-music"></i>';
    }

    const songInfo = document.createElement("div");
    songInfo.className = "song-info";

    const songTitle = document.createElement("span");
    songTitle.textContent = song.title;
    songTitle.className = "song-title";

    const songArtist = document.createElement("span");
    songArtist.textContent = song.artist;
    songArtist.className = "song-artist";

    songInfo.appendChild(songTitle);
    songInfo.appendChild(songArtist);

    li.appendChild(coverArt);
    li.appendChild(songInfo);

    songList.appendChild(li);
  });

  if (songs.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No se encontraron canciones";
    li.className = "no-results fade-in";
    songList.appendChild(li);
  }
}

// Función para reproducir una canción
function playSong(index) {
  if (index >= 0 && index < songsData.length) {
    currentSongIndex = index;
    const song = songsData[index];
    const audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.src = song.link;
    audioPlayer.play().catch((error) => {
      console.error("Error playing audio:", error);
      // Aquí puedes añadir código para mostrar un mensaje de error al usuario
    });
    isPlaying = true;
    updatePlayPauseButton();
    document.getElementById(
      "nowPlaying"
    ).textContent = `Reproduciendo: ${song.title} - ${song.artist}`;
    highlightCurrentSong();
  }
}

// Función para resaltar la canción actual
function highlightCurrentSong() {
  const songItems = document.querySelectorAll(
    "#songList li, #searchResults li"
  );
  songItems.forEach((item, i) => {
    if (i === currentSongIndex) {
      item.classList.add("playing");
    } else {
      item.classList.remove("playing");
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
    audioPlayer.play().catch((error) => {
      console.error("Error playing audio:", error);
      // Aquí puedes añadir código para mostrar un mensaje de error al usuario
    });
  }
  isPlaying = !isPlaying;
  updatePlayPauseButton();
}

// Función para reproducir la siguiente canción
function playNextSong() {
  const songs = songsData;
  if (songs.length > 0) {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    playSong(currentSongIndex);
  }
}

// Función para reproducir la canción anterior
function playPreviousSong() {
  const songs = songsData;
  if (songs.length > 0) {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    playSong(currentSongIndex);
  }
}

// Función para actualizar la barra de progreso
function updateProgressBar() {
  const audioPlayer = document.getElementById("audioPlayer");
  const progressBar = document.getElementById("progressBar");
  if (!isNaN(audioPlayer.duration)) {
    const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.style.width = `${progress}%`;
  }
}

// Función para cambiar la posición de reproducción
function setPlaybackPosition(e) {
  const progressContainer = document.getElementById("progressContainer");
  const audioPlayer = document.getElementById("audioPlayer");
  const clickPosition =
    (e.clientX - progressContainer.getBoundingClientRect().left) /
    progressContainer.offsetWidth;
  if (!isNaN(audioPlayer.duration)) {
    audioPlayer.currentTime = clickPosition * audioPlayer.duration;
  }
}

// Función para realizar la búsqueda
function searchSongs() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const filteredSongs = songsData.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm) ||
      song.artist.toLowerCase().includes(searchTerm)
  );
  updateSongList(filteredSongs, "searchResults");

  // Mostrar la vista de búsqueda
  changeView("search");
}

// Función para ajustar el volumen
function adjustVolume() {
  const volumeControl = document.getElementById("volumeControl");
  const audioPlayer = document.getElementById("audioPlayer");
  audioPlayer.volume = volumeControl.value;

  // Actualizar el icono de volumen
  updateVolumeIcon(audioPlayer.volume);
}

// Función para actualizar el icono de volumen
function updateVolumeIcon(volume) {
  const volumeIcon = document.querySelector(".volume-icon");
  if (volume === 0) {
    volumeIcon.className = "fas fa-volume-mute volume-icon";
  } else if (volume < 0.5) {
    volumeIcon.className = "fas fa-volume-down volume-icon";
  } else {
    volumeIcon.className = "fas fa-volume-up volume-icon";
  }
}

// Función para silenciar/activar el sonido
function toggleMute() {
  const audioPlayer = document.getElementById("audioPlayer");
  const volumeControl = document.getElementById("volumeControl");

  if (audioPlayer.volume > 0) {
    audioPlayer.dataset.lastVolume = audioPlayer.volume;
    audioPlayer.volume = 0;
    volumeControl.value = 0;
  } else {
    audioPlayer.volume = audioPlayer.dataset.lastVolume || 1;
    volumeControl.value = audioPlayer.volume;
  }

  updateVolumeIcon(audioPlayer.volume);
}

// Función para cambiar la vista
function changeView(viewName) {
  const views = document.querySelectorAll(".view");
  views.forEach((view) => (view.style.display = "none"));
  document.getElementById(`${viewName}View`).style.display = "block";
}

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", async () => {
  const songs = await loadSongs();
  updateSongList(songs);

  // Event listeners para los controles de reproducción
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

  // Event listener para actualizar la barra de progreso
  document
    .getElementById("audioPlayer")
    .addEventListener("timeupdate", updateProgressBar);

  // Event listeners para la búsqueda
  document
    .getElementById("searchButton")
    .addEventListener("click", searchSongs);
  document.getElementById("searchInput").addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      searchSongs();
    }
  });

  // Event listener para el control de volumen
  const volumeControl = document.getElementById("volumeControl");
  volumeControl.addEventListener("input", adjustVolume);

  // Event listener para el icono de volumen (silenciar/activar)
  const volumeIcon = document.querySelector(".volume-icon");
  volumeIcon.addEventListener("click", toggleMute);

  // Inicializar el volumen
  const audioPlayer = document.getElementById("audioPlayer");
  audioPlayer.volume = volumeControl.value;
  updateVolumeIcon(audioPlayer.volume);

  // Event listeners para la navegación
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => changeView(item.dataset.view));
  });

  // Inicializar la vista de inicio
  changeView("home");
});
