document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search');
  const statusSelect = document.getElementById('statusFilter');
  const rows = document.querySelectorAll('#complaintsBody tr');

  function applyFilters() {
    const term = searchInput.value.toLowerCase().trim();
    const status = statusSelect.value;

    rows.forEach(row => {
      const text = row.getAttribute('data-search') || '';
      const rowStatus = row.getAttribute('data-status') || '';

      const matchText = text.includes(term);
      const matchStatus = !status || rowStatus === status;

      row.style.display = matchText && matchStatus ? '' : 'none';
    });
  }

  searchInput.addEventListener('input', applyFilters);
  statusSelect.addEventListener('change', applyFilters);
});