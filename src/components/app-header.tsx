export function AppHeader() {
  return (
    <header class="app-header">
      <a class="brand" href="#" aria-label="KamaCafé home">
        <span class="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" focusable="false">
            <path d="M29.4 8.7c-6.1-3.5-14.6-.5-18.9 6.8-4.2 7.2-2.8 15.9 3.4 19.5 6.1 3.5 14.5.5 18.8-6.8 4.2-7.2 2.8-15.9-3.3-19.5Z" />
            <path class="brand__bean-line" d="M27.2 10.4c-1.8 5.7-5 8.4-9 10.8-3.4 2-5.6 5.7-5.8 10.8" />
          </svg>
        </span>
        <span>KamaCafé - Brew the perfect cup</span>
      </a>
    </header>
  );
}
