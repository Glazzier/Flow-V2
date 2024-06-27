// Variables globales
let currentSongIndex = 0;
let isPlaying = false;
let songsData = [];
let libraryData = [];
let currentSongList = [];
let playlists = [];
let currentPlaylistId = null;
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

// Función para cargar playlists desde el almacenamiento local
function loadPlaylists() {
  const storedPlaylists = localStorage.getItem("flowPlaylists");
  if (storedPlaylists) {
    playlists = JSON.parse(storedPlaylists);
    updatePlaylistsList();
  }
}

// Función para guardar playlists en el almacenamiento local
function savePlaylists() {
  localStorage.setItem("flowPlaylists", JSON.stringify(playlists));
}

// Función para crear una nueva playlist
function createPlaylist(name) {
  const newPlaylist = {
    id: Date.now(),
    name: name,
    songs: [],
  };
  playlists.push(newPlaylist);
  savePlaylists();
  updatePlaylistsList();
}

// Función para actualizar la lista de playlists en la interfaz
function updatePlaylistsList() {
  const playlistList = document.getElementById("playlistList");
  playlistList.innerHTML = "";

  playlists.forEach((playlist) => {
    const li = document.createElement("li");
    li.className = "playlist-item";
    li.innerHTML = `
      <div class="playlist-info">
        <i class="fas fa-list playlist-icon"></i>
        <span class="playlist-name">${playlist.name}</span>
        <span class="playlist-song-count">${playlist.songs.length} canciones</span>
      </div>
      <button class="delete-playlist-btn" onclick="deletePlaylist(${playlist.id})">
        <i class="fas fa-trash"></i>
      </button>
    `;
    li.onclick = () => showPlaylistSongs(playlist);
    playlistList.appendChild(li);
  });
}

// Función para eliminar una playlist
function deletePlaylist(playlistId) {
  playlists = playlists.filter((playlist) => playlist.id !== playlistId);
  savePlaylists();
  updatePlaylistsList();
}

// Función para formatear el tiempo en minutos:segundos
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// Función para actualizar el tiempo de reproducción
function updateTime() {
  const audioPlayer = document.getElementById("audioPlayer");
  const currentTimeElement = document.getElementById("currentTime");
  const totalTimeElement = document.getElementById("totalTime");

  currentTimeElement.textContent = formatTime(audioPlayer.currentTime);

  if (!isNaN(audioPlayer.duration)) {
    totalTimeElement.textContent = formatTime(audioPlayer.duration);
  }
}

// Función para mostrar las canciones de una playlist
function showPlaylistSongs(playlist) {
  currentPlaylistId = playlist.id;
  const playlistView = document.getElementById("playlistView");
  playlistView.innerHTML = `
    <h2>${playlist.name}</h2>
    <p>${playlist.songs.length} canciones</p>
    <ul id="playlistSongsList"></ul>
  `;

  const playlistSongsList = document.getElementById("playlistSongsList");
  playlist.songs.forEach((song, index) => {
    const li = createSongListItem(song, index, "playlistSongsList");
    playlistSongsList.appendChild(li);
  });

  changeView("playlist");
}

function playFromPlaylist(index) {
  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
  if (currentPlaylist) {
    currentSongList = currentPlaylist.songs;
    playSong(index, "playlistSongsList");
  }
}

// Función para agregar una canción a una playlist
function addSongToPlaylist(song, playlistId) {
  const playlist = playlists.find((p) => p.id === playlistId);
  if (playlist) {
    // Verificar si la canción ya está en la playlist
    const songExists = playlist.songs.some(
      (s) => s.title === song.title && s.artist === song.artist
    );
    if (!songExists) {
      playlist.songs.push(song);
      savePlaylists();
      updatePlaylistsList(); // Actualizar la lista de playlists
      showPlaylistSongs(playlist); // Mostrar las canciones actualizadas de la playlist
      alert(
        `"${song.title}" ha sido añadida a la playlist "${playlist.name}".`
      );
    } else {
      alert(`"${song.title}" ya está en la playlist "${playlist.name}".`);
    }
  }
}

// Función para mostrar el modal de agregar a playlist
function showAddToPlaylistModal(song) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Agregar a playlist</h3>
      <ul id="playlistModalList"></ul>
    </div>
  `;

  const playlistModalList = modal.querySelector("#playlistModalList");
  playlists.forEach((playlist) => {
    const li = document.createElement("li");
    li.textContent = playlist.name;
    li.onclick = () => {
      addSongToPlaylist(song, playlist.id);
      modal.remove();
    };
    playlistModalList.appendChild(li);
  });

  document.body.appendChild(modal);
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
}

function removeFromPlaylist(song, playlistId) {
  const playlist = playlists.find((p) => p.id === playlistId);
  if (playlist) {
    playlist.songs = playlist.songs.filter(
      (s) => !(s.title === song.title && s.artist === song.artist)
    );
    savePlaylists();
    showPlaylistSongs(playlist);
    alert(
      `"${song.title}" ha sido eliminada de la playlist "${playlist.name}".`
    );
  }
}

// Función para crear un elemento de lista de canción
function createSongListItem(song, index, containerId) {
  const li = document.createElement("li");
  li.className = "song-item fade-in";
  li.onclick = () => playSong(index, containerId);
  li.oncontextmenu = (e) => showContextMenu(e, song, containerId);

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
  } else if (containerId === "playlistSongsList") {
    actionButton.innerHTML = '<i class="fas fa-trash"></i>';
    actionButton.onclick = (e) => {
      e.stopPropagation();
      removeFromPlaylist(song, currentPlaylistId);
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

  // Agregar botón para añadir a playlist
  const addToPlaylistBtn = document.createElement("button");
  addToPlaylistBtn.className = "add-to-playlist-btn";
  addToPlaylistBtn.innerHTML = '<i class="fas fa-list"></i>';
  addToPlaylistBtn.onclick = (e) => {
    e.stopPropagation();
    showAddToPlaylistModal(song);
  };

  li.appendChild(addToPlaylistBtn);

  return li;
}

// Función para mostrar el menú contextual
function showContextMenu(e, song, containerId) {
  e.preventDefault();
  const contextMenu = document.createElement("div");
  contextMenu.className = "context-menu";

  if (containerId === "libraryList") {
    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="removeFromLibrary">Quitar de la biblioteca</div>
      <div class="context-menu-item" data-action="addToPlaylist">Añadir a playlist</div>
    `;
  } else {
    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="addToLibrary">Añadir a la biblioteca</div>
      <div class="context-menu-item" data-action="addToPlaylist">Añadir a playlist</div>
    `;
  }

  document.body.appendChild(contextMenu);

  contextMenu.style.top = `${e.pageY}px`;
  contextMenu.style.left = `${e.pageX}px`;

  setTimeout(() => contextMenu.classList.add("active"), 10);

  contextMenu.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (action === "addToLibrary") {
      addToLibrary(song);
    } else if (action === "removeFromLibrary") {
      removeFromLibrary(song);
    } else if (action === "addToPlaylist") {
      showAddToPlaylistModal(song);
    }
    contextMenu.remove();
  });

  document.addEventListener("click", () => contextMenu.remove(), {
    once: true,
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
  } else if (sourceId === "playlistSongsList") {
    const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
    songList = currentPlaylist ? currentPlaylist.songs : [];
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

    // Actualizar el tiempo total cuando se carguen los metadatos
    audioPlayer.onloadedmetadata = () => {
      document.getElementById("totalTime").textContent = formatTime(
        audioPlayer.duration
      );
    };
  }
}

// Función para mostrar el menú contextual
function showContextMenu(e, song) {
  e.preventDefault();
  const contextMenu = document.createElement("div");
  contextMenu.className = "context-menu";
  contextMenu.innerHTML = `
    <div class="context-menu-item" data-action="addToLibrary">Añadir a la biblioteca</div>
    <div class="context-menu-item" data-action="addToPlaylist">Añadir a playlist</div>
  `;

  document.body.appendChild(contextMenu);

  contextMenu.style.top = `${e.pageY}px`;
  contextMenu.style.left = `${e.pageX}px`;

  setTimeout(() => contextMenu.classList.add("active"), 10);

  contextMenu.addEventListener("click", (event) => {
    const action = event.target.dataset.action;
    if (action === "addToLibrary") {
      addToLibrary(song);
    } else if (action === "addToPlaylist") {
      showAddToPlaylistModal(song);
    }
    contextMenu.remove();
  });

  document.addEventListener("click", () => contextMenu.remove(), {
    once: true,
  });
}

// Función para actualizar la información del reproductor
function updatePlayerInfo(song) {
  document.getElementById("playerSongTitle").textContent = song.title;
  document.getElementById("playerSongArtist").textContent = song.artist;
  const playerCover = document.getElementById("playerCover");
  if (song.cover) {
    playerCover.style.backgroundImage = `url(${song.cover})`;
    playerCover.innerHTML = "";
  } else {
    playerCover.style.backgroundImage = "none";
    playerCover.innerHTML = '<i class="fas fa-music"></i>';
  }
}

// Función para resaltar la canción actual
function highlightCurrentSong(sourceId) {
  const allSongItems = document.querySelectorAll(
    "#songList li, #searchResults li, #libraryList li"
  );
  allSongItems.forEach((item) => item.classList.remove("playing"));

  let currentList;
  if (sourceId === "libraryList") {
    currentList = document.getElementById("libraryList");
  } else {
    currentList = document.getElementById(
      sourceId === "searchResults" ? "searchResults" : "songList"
    );
  }

  const currentSongItem = currentList.children[currentSongIndex];
  if (currentSongItem) {
    currentSongItem.classList.add("playing");
  }
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
    updateTime();
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
  loadPlaylists();

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

  // Event listener para actualizar la barra de progreso y el tiempo
  document
    .getElementById("audioPlayer")
    .addEventListener("timeupdate", updateProgressBar);

  // Event listeners para la navegación
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      changeView(item.dataset.view);
      // Actualizar la lista actual cuando se cambia de vista
      if (item.dataset.view === "library") {
        currentSongList = libraryData;
      } else if (item.dataset.view === "home") {
        currentSongList = songsData;
      }
    });
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

  // Event listener para el botón de búsqueda
  document
    .getElementById("searchButton")
    .addEventListener("click", searchSongs);

  // Event listener para la tecla Enter en el campo de búsqueda
  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchSongs();
    }
  });

  // Evento para crear una nueva playlist
  document.getElementById("createPlaylistBtn").addEventListener("click", () => {
    const playlistName = prompt("Ingrese el nombre de la nueva playlist:");
    if (playlistName) {
      createPlaylist(playlistName);
    }
  });

  // Inicializar la vista de inicio
  changeView("home");
});
