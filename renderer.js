let currentEvent = null;
let currentSort = 'name';
let editingDonationId = null;

function renderDonations() {
    const tbody = document.getElementById('donations-body');
    tbody.innerHTML = '';
    const sorted = getSortedDonations();

    sorted.forEach(donation => {
        const donor = currentEvent.donors.find(d => d.id === donation.donorId);
        const tr = document.createElement('tr');
        const tdName = document.createElement('td');
        tdName.textContent = donor.name;
        tr.appendChild(tdName);
        const tdAmount = document.createElement('td');
        tdAmount.textContent = donation.amount.toFixed(2);
        tr.appendChild(tdAmount);
        const tdTimestamp = document.createElement('td');
        tdTimestamp.textContent = new Date(donation.timestamp).toLocaleString('en-KE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        tr.appendChild(tdTimestamp);
        const tdActions = document.createElement('td');
        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-delete';
        btnDelete.textContent = 'Delete';
        btnDelete.addEventListener('click', () => deleteDonation(donation.id));
        tr.appendChild(tdActions);
        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-edit';
        btnEdit.textContent = 'Edit';
        btnEdit.addEventListener('click', () => openEditModal(donation.id));
        tdActions.appendChild(btnEdit);
        tdActions.appendChild(btnDelete);
        tbody.appendChild(tr);
    });
}

async function openEditModal(donationId) {
    const donation = currentEvent.donations.find(d => d.id === donationId);
    const donName = currentEvent.donors.find(d => d.id === donation.donorId).name;
    editingDonationId = donationId;
    document.getElementById('edit-donor-name').value = donName;
    document.getElementById('edit-amount').value = donation.amount;
    document.getElementById('modal-edit-donation').style.display = 'flex';
}

async function deleteDonation(donationId) {
    showConfirm('Are you sure you want to delete this donation? This cannot be undone.', async () => {
        const donationIndex = currentEvent.donations.findIndex(d => d.id === donationId);
        if (donationIndex !== -1) {
            currentEvent.donations.splice(donationIndex, 1);
            updateTotal();
            await window.api.saveEvent(currentEvent);
            renderDonations();
        }
    });
}

async function deleteEvent(id) {
    console.log('deleteEvent called with id:', id);
    showConfirm('Are you sure you want to delete this event? This cannot be undone.', async () => {
        await window.api.deleteEvent(id);
        if (currentEvent && currentEvent.id === id) {
            currentEvent = null;
            document.getElementById('view-event').style.display = 'none';
            document.getElementById('view-empty').style.display = 'block';
        }
        await loadSidebar();
    });
}

function showConfirm(message, onConfirm) {
    console.log('showConfirm called');
    document.getElementById('modal-confirm-message').textContent = message;
    document.getElementById('modal-confirm').style.display = 'flex';
    document.getElementById('modal-confirm-ok').onclick = () => {
        document.getElementById('modal-confirm').style.display = 'none';
        onConfirm();
    };
    document.getElementById('modal-confirm-cancel').onclick = () => {
        document.getElementById('modal-confirm').style.display = 'none';
    };
}

function resolveDonor(donorName) {
    return new Promise((resolve) => {
        const existing = currentEvent.donors.find(
            d => d.name.toLowerCase() === donorName.toLowerCase()
        );

        if (!existing) {
            // no match — create new donor
            resolve({ id: 'don_' + window.crypto.randomUUID(), name: donorName });
            return;
        }

        // match found — ask user
        document.getElementById('modal-disambiguate-message').textContent =
            `There is already a donor named "${existing.name}". Is this the same person?`;
        document.getElementById('modal-disambiguate').style.display = 'flex';

        document.getElementById('modal-disambiguate-yes').onclick = () => {
            document.getElementById('modal-disambiguate').style.display = 'none';
            resolve(existing); // reuse existing donor
        };
        document.getElementById('modal-disambiguate-no').onclick = () => {
            document.getElementById('modal-disambiguate').style.display = 'none';
            resolve({ id: 'don_' + window.crypto.randomUUID(), name: donorName }); // new donor
        };
        document.getElementById('modal-disambiguate-cancel').onclick = () => {
            document.getElementById('modal-disambiguate').style.display = 'none';
            resolve(null); // cancelled
        };
    });
}

function updateTotal() {
    let total = 0;
    currentEvent.donations.forEach(donation => {
        total += donation.amount;
    });
    document.getElementById('event-total').textContent = total.toFixed(2);
}

async function selectEvent(id) {
    currentEvent = await window.api.loadEvent(id);
    const eventName = document.getElementById('event-name');
    eventName.textContent = currentEvent.name;
    document.getElementById('view-empty').style.display = 'none';
    document.getElementById('view-event').style.display = 'block';
    updateTotal();
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

        const btnDelete = document.createElement('button');
        btnDelete.textContent = 'X';
        btnDelete.className = 'btn-delete-event';
        btnDelete.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEvent(event.id);
        });

        li.appendChild(btnDelete);
        list.appendChild(li);
    });
}

document.getElementById('form-add-donation').addEventListener('submit', async (e) => {
    e.preventDefault();
    const donorName = document.getElementById('inp-donor').value.trim();
    const amount = parseFloat(document.getElementById('inp-amount').value);
    if (currentEvent && donorName && !isNaN(amount)) {
        const donor = await resolveDonor(donorName);
        if (!donor) return; // user cancelled
        currentEvent = await window.api.addDonation(currentEvent.id, donor.id, donor.name, amount);
        updateTotal();
        renderDonations();
        document.getElementById('form-add-donation').reset();
    }
});

document.getElementById('btn-new-event').addEventListener('click', () => {
    document.getElementById('modal-new-event').style.display = 'flex';
});

document.getElementById('modal-cancel').addEventListener('click', () => {
    document.getElementById('modal-new-event').style.display = 'none';
});

document.getElementById('modal-event-confirm').addEventListener('click', async () => {
    const name = document.getElementById('modal-event-name').value.trim();
    const date = document.getElementById('modal-event-date').value;
    if (name && date) {
        const newEvent = await window.api.createEvent(name, date);
        document.getElementById('modal-new-event').style.display = 'none';
        await loadSidebar();
        selectEvent(newEvent.id);
    }
});

document.getElementById('sort-select').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderDonations();
});

document.getElementById('edit-cancel').addEventListener('click', () => {
    document.getElementById('modal-edit-donation').style.display = 'none';
    editingDonationId = null;
});

document.getElementById('edit-confirm').addEventListener('click', async () => {
    const donorName = document.getElementById('edit-donor-name').value.trim();
    const amount = parseFloat(document.getElementById('edit-amount').value);
    if (currentEvent && editingDonationId && donorName && !isNaN(amount)) {
        document.getElementById('modal-edit-donation').style.display = 'none';
        const donation = currentEvent.donations.find(d => d.id === editingDonationId);
        const existingDonor = currentEvent.donors.find(d => d.name.toLowerCase() === donorName.toLowerCase());
        if (existingDonor) {
            donation.donorId = existingDonor.id;
        } else {
            const currentDonor = currentEvent.donors.find(d => d.id === donation.donorId);
            currentDonor.name = donorName;
        }
        donation.amount = amount;
        updateTotal();
        await window.api.saveEvent(currentEvent);
        renderDonations();
        editingDonationId = null;
    }
});

document.getElementById('export-json').addEventListener('click', async () => {
    const result = await window.api.exportAs('json', getSortedEventForExport());
    if (result.success) alert(`Saved to ${result.filePath}`);
});

document.getElementById('export-csv').addEventListener('click', async () => {
    const result = await window.api.exportAs('csv', getSortedEventForExport());
    if (result.success) alert(`Saved to ${result.filePath}`);
});

document.getElementById('export-excel').addEventListener('click', async () => {
    const result = await window.api.exportAs('excel', getSortedEventForExport());
    if (result.success) alert(`Saved to ${result.filePath}`);
});

document.getElementById('export-pdf').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // title
    doc.setFontSize(18);
    doc.text(currentEvent.name, 14, 20);

    // total
    const total = getSortedEventForExport().donations.reduce((sum, d) => sum + d.amount, 0);
    doc.setFontSize(12);
    doc.text(`Total Collected: KES ${total.toFixed(2)}`, 14, 30);

    // table header
    doc.setFontSize(10);
    doc.text('Donor Name', 14, 45);
    doc.text('Amount', 100, 45);
    doc.text('Date', 140, 45);

    // rows
    let y = 55;
    getSortedEventForExport().donations.forEach(donation => {
        const donor = getSortedEventForExport().donors.find(d => d.id === donation.donorId);
        doc.text(donor.name, 14, y);
        doc.text(donation.amount.toFixed(2), 100, y);
        doc.text(donation.timestamp, 140, y);
        y += 10;
    });

    // convert to buffer and send to main to save
    const buffer = doc.output('arraybuffer');
    const result = await window.api.saveBuffer({
        buffer: Array.from(new Uint8Array(buffer)),
        defaultName: `${currentEvent.name}_export`,
        extension: 'pdf'
    });
    if (result.success) alert(`Saved to ${result.filePath}`);
});

function getSortedEventForExport() {
    const sortedDonations = getSortedDonations();
    return { ...currentEvent, donations: sortedDonations };
}

function getSortedDonations() {
    if (currentSort === 'name') {
        return [...currentEvent.donations].sort((a, b) => {
            const nameA = currentEvent.donors.find(d => d.id === a.donorId).name;
            const nameB = currentEvent.donors.find(d => d.id === b.donorId).name;
            return nameA.localeCompare(nameB);
        });
    } else if (currentSort === 'amount') {
        return [...currentEvent.donations].sort((a, b) => b.amount - a.amount);
    } else {
        return [...currentEvent.donations].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
}

loadSidebar();