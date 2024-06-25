// Variables globales
let currentSongIndex = 0;
let isPlaying = false;
let songsData = [];
let libraryData = [];
let currentSongList = [];
const MAX_VOLUME = 0.35;

// Función para cargar canciones desde el archivo JSON
async function loadSongs() {
  try {
    const response = await fetch("songs.json");
    const data = await response.json();
    songsData = data.songs;
    currentSongList = songsData;
    updateGenreFilter();
    loadLibrary();
    return songsData;
  } catch (error) {
    console.error("Error fetching songs:", error);
    return [];
  }
}

// Función para cargar la biblioteca
function loadLibrary() {
  const storedLibrary = localStorage.getItem("flowLibrary");
  if (storedLibrary) {
    libraryData = JSON.parse(storedLibrary);
    updateSongList(libraryData, "libraryList");
  }
}

// Función para guardar la biblioteca
function saveLibrary() {
  localStorage.setItem("flowLibrary", JSON.stringify(libraryData));
}

// Función para actualizar el filtro de géneros
function updateGenreFilter() {
  const genreFilter = document.getElementById("genreFilter");
  const genres = new Set(songsData.map((song) => song.genre));
  genres.forEach((genre) => {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    genreFilter.appendChild(option);
  });
}

// Función para actualizar la lista de canciones en la interfaz
function updateSongList(songs, containerId = "songList") {
  const songList = document.getElementById(containerId);
  songList.innerHTML = "";

  songs.forEach((song, index) => {
    const li = createSongListItem(song, index, containerId);
    songList.appendChild(li);
  });

  if (songs.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No se encontraron canciones";
    li.className = "no-results fade-in";
    songList.appendChild(li);
  }

  if (containerId === "songList" || containerId === "searchResults") {
    currentSongList = songs;
  }
}

// Función para crear un elemento de lista de canción
function createSongListItem(song, index, containerId) {
  const li = document.createElement("li");
  li.className = "song-item fade-in";
  li.onclick = () => playSong(index, containerId);

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

  const playingIndicator = document.createElement("div");
  playingIndicator.className = "playing-indicator";
  playingIndicator.textContent = "Reproduciendo";

  const actionButton = document.createElement("button");
  actionButton.className = "song-action-btn";

  if (containerId === "libraryList") {
    actionButton.innerHTML = '<i class="fas fa-trash"></i>';
    actionButton.onclick = (e) => {
      e.stopPropagation();
      removeFromLibrary(song);
    };
  } else {
    actionButton.innerHTML = '<i class="fas fa-plus"></i>';
    actionButton.onclick = (e) => {
      e.stopPropagation();
      addToLibrary(song);
    };
  }

  songInfo.appendChild(songTitle);
  songInfo.appendChild(songArtist);

  li.appendChild(coverArt);
  li.appendChild(songInfo);
  li.appendChild(playingIndicator);
  li.appendChild(actionButton);

  return li;
}

// Función para mostrar el menú contextual
function showContextMenu(e, song, containerId) {
  e.preventDefault();
  const contextMenu = document.createElement("div");
  contextMenu.className = "context-menu";

  const addToLibraryItem = document.createElement("div");
  addToLibraryItem.className = "context-menu-item";
  addToLibraryItem.textContent = "Añadir a la biblioteca";
  addToLibraryItem.onclick = () => addToLibrary(song);

  contextMenu.appendChild(addToLibraryItem);
  document.body.appendChild(contextMenu);

  contextMenu.style.display = "block";
  contextMenu.style.left = `${e.pageX}px`;
  contextMenu.style.top = `${e.pageY}px`;

  document.addEventListener("click", () => {
    contextMenu.remove();
  });
}

// Función para añadir una canción a la biblioteca
function addToLibrary(song) {
  if (
    !libraryData.some(
      (librarySong) =>
        librarySong.title === song.title && librarySong.artist === song.artist
    )
  ) {
    libraryData.push(song);
    saveLibrary();
    updateSongList(libraryData, "libraryList");
    alert(`"${song.title}" ha sido añadida a tu biblioteca.`);
  } else {
    alert(`"${song.title}" ya está en tu biblioteca.`);
  }
}

// Función para eliminar una canción de la biblioteca
function removeFromLibrary(song) {
  libraryData = libraryData.filter(
    (librarySong) =>
      !(librarySong.title === song.title && librarySong.artist === song.artist)
  );
  saveLibrary();
  updateSongList(libraryData, "libraryList");
  alert(`"${song.title}" ha sido eliminada de tu biblioteca.`);
}

// Función para reproducir una canción
function playSong(index, sourceId) {
  let songList;
  if (sourceId === "libraryList") {
    songList = libraryData;
  } else {
    songList = currentSongList;
  }

  if (index >= 0 && index < songList.length) {
    currentSongIndex = index;
    const song = songList[index];
    const audioPlayer = document.getElementById("audioPlayer");
    audioPlayer.src = song.link;
    audioPlayer.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
    isPlaying = true;
    updatePlayPauseButton();
    updatePlayerInfo(song);
    highlightCurrentSong(sourceId);
  }
}

// Función para actualizar la información del reproductor
function updatePlayerInfo(song) {
  document.getElementById("playerSongTitle").textContent = song.title;
  document.getElementById("playerSongArtist").textContent = song.artist;
  const playerCover = document.getElementById("playerCover");
  if (song.cover) {
    playerCover.style.backgroundImage = `url(${song.cover})`;
  } else {
    playerCover.style.backgroundImage = "none";
    playerCover.innerHTML = '<i class="fas fa-music"></i>';
  }
}

// Función para resaltar la canción actual
function highlightCurrentSong(sourceId) {
  const songItems = document.querySelectorAll(
    "#songList li, #searchResults li, #libraryList li"
  );
  songItems.forEach((item, i) => {
    if (sourceId === "libraryList") {
      if (i === currentSongIndex && item.closest("#libraryList")) {
        item.classList.add("playing");
      } else {
        item.classList.remove("playing");
      }
    } else {
      if (i === currentSongIndex && !item.closest("#libraryList")) {
        item.classList.add("playing");
      } else {
        item.classList.remove("playing");
      }
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
    });
  }
  isPlaying = !isPlaying;
  updatePlayPauseButton();
}

// Función para reproducir la siguiente canción
function playNextSong() {
  if (currentSongList.length > 0) {
    currentSongIndex = (currentSongIndex + 1) % currentSongList.length;
    playSong(currentSongIndex);
  }
}

// Función para reproducir la canción anterior
function playPreviousSong() {
  if (currentSongList.length > 0) {
    currentSongIndex =
      (currentSongIndex - 1 + currentSongList.length) % currentSongList.length;
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

function adjustVolume() {
  const volumeControl = document.getElementById("volumeControl");
  const audioPlayer = document.getElementById("audioPlayer");
  let newVolume = volumeControl.value * MAX_VOLUME; // Escalar el volumen

  audioPlayer.volume = newVolume;

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

function toggleMute() {
  const audioPlayer = document.getElementById("audioPlayer");
  const volumeControl = document.getElementById("volumeControl");

  if (audioPlayer.volume > 0) {
    audioPlayer.dataset.lastVolume = audioPlayer.volume / MAX_VOLUME;
    audioPlayer.volume = 0;
    volumeControl.value = 0;
  } else {
    const lastVolume = audioPlayer.dataset.lastVolume || 1;
    audioPlayer.volume = lastVolume * MAX_VOLUME;
    volumeControl.value = lastVolume;
  }

  updateVolumeIcon(audioPlayer.volume);
}

// Función para cambiar la vista
function changeView(viewName) {
  const views = document.querySelectorAll(".view");
  views.forEach((view) => (view.style.display = "none"));
  document.getElementById(`${viewName}View`).style.display = "block";

  // Actualizar la lista de canciones si es la vista de biblioteca
  if (viewName === "library") {
    updateSongList(libraryData, "libraryList");
  }
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
  audioPlayer.volume = volumeControl.value * MAX_VOLUME;
  updateVolumeIcon(audioPlayer.volume);

  // Limitar el volumen inicial al máximo permitido
  if (volumeControl.value > MAX_VOLUME) {
    volumeControl.value = MAX_VOLUME;
  }
  audioPlayer.volume = volumeControl.value;
  updateVolumeIcon(audioPlayer.volume);

  // Event listeners para la navegación
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => changeView(item.dataset.view));
  });

  // Actualizar la información del reproductor cuando cambie la canción
  audioPlayer.addEventListener("loadedmetadata", () => {
    updatePlayerInfo(currentSongList[currentSongIndex]);
  });

  // Event listener para el filtro de géneros
  document.getElementById("genreFilter").addEventListener("change", (e) => {
    const selectedGenre = e.target.value;
    const filteredSongs =
      selectedGenre === "all"
        ? songsData
        : songsData.filter((song) => song.genre === selectedGenre);
    updateSongList(filteredSongs);
    currentSongIndex = 0;
    if (filteredSongs.length > 0) {
      updatePlayerInfo(filteredSongs[0]);
    }
  });

  // Inicializar la vista de inicio
  changeView("home");
});
