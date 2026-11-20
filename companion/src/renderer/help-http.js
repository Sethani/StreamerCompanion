async function getHelp(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Guide unavailable.');
  return body;
}
const help = CompanionHelp.mount(document.getElementById('help'), {
  index: () => getHelp('/api/help/index'),
  read: id => getHelp('/api/help/guide?id=' + encodeURIComponent(id))
});
help.open(new URLSearchParams(location.search).get('id') || 'getting-started');
// Shared preference changes can hide an already-open engineering guide.
setInterval(() => help.refresh(), 3000);
