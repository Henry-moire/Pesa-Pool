let currentEvent = null;

function renderDonations() {
    const tbody = document.getElementById('donations-body');
    tbody.innerHTML = '';
    currentEvent.donations.forEach(donation => {
        const donor = currentEvent.donors.find(d => d.id === donation.donorId);
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = donor.name;
        tr.appendChild(tdName);
        const tdAmount = document.createElement('td');
        tdAmount.textContent = donation.amount.toFixed(2);
        tr.appendChild(tdAmount);
        const tdTimestamp = document.createElement('td');
        tdTimestamp.textContent = donation.timestamp;
        tr.appendChild(tdTimestamp);
        tbody.appendChild(tr);
    });
}

async function selectEvent(id) {
    currentEvent = await window.api.loadEvent(id);
    const eventName = document.getElementById('event-name');
    eventName.textContent = currentEvent.name;
    document.getElementById('view-empty').style.display = 'none';
    document.getElementById('view-event').style.display = 'block';
    let eventTotal = 0;
    currentEvent.donations.forEach(donation => {
        eventTotal += donation.amount;
    });
    document.getElementById('event-total').textContent = eventTotal.toFixed(2);
    renderDonations();
}

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

document.getElementById('form-add-donation').addEventListener('submit', async (e) => {
    e.preventDefault(); // stops the form from reloading the page
    const donorName = document.getElementById('inp-donor').value;
    const amount = parseFloat(document.getElementById('inp-amount').value);
    if (currentEvent && donorName && !isNaN(amount)) {
        await window.api.addDonation(currentEvent.id, donorName, amount);
        document.getElementById('form-add-donation').reset();
        currentEvent = await window.api.loadEvent(currentEvent.id);
        renderDonations();
    }
});

loadSidebar();