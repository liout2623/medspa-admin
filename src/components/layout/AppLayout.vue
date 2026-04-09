<template>
  <div class="app-shell">
    <aside class="sidebar">
      <h1>Medspa Admin</h1>
      <nav>
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/users">Users</RouterLink>
        <RouterLink to="/customers">Customers</RouterLink>
      </nav>
    </aside>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 220px 1fr;
  background: #f5f7fb;
}

.sidebar {
  padding: 24px;
  background: #1f2937;
  color: #fff;
}

.sidebar h1 {
  margin: 0 0 20px;
  font-size: 18px;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar a {
  color: #cbd5e1;
  text-decoration: none;
}

.sidebar a.router-link-active {
  color: #fff;
  font-weight: 600;
}

.content {
  padding: 24px;
}
</style>
