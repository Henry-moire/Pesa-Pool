let currentEvent = null;

  async function loadSidebar() {
    const events = await window.api.listEvents();
    const list = document.getElementById('event-list');
    list.innerHTML = '';
    events.forEach(event => {
      const li = document.createElement('li');
      li.textContent = event.name;
      li.dataset.id = event.id;
      li.addEventListener('click', () => selectEvent(event.id));
      list.appendChild(li);
    });
  }

loadSidebar();