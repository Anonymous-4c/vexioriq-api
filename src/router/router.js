export function createRouter() {
  const routes = [];

  function addRoute(method, path, handler) {
    routes.push({ method: method.toUpperCase(), path, handler });
  }

  function match(method, pathname) {
    for (const route of routes) {
      if (route.method !== method.toUpperCase()) continue;

      const routeParts = route.path.split('/');
      const pathParts = pathname.split('/');

      if (routeParts.length !== pathParts.length) continue;

      let isMatch = true;
      const params = {};

      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          params[routeParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
        } else if (routeParts[i] !== pathParts[i]) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) return { handler: route.handler, params };
    }
    return null;
  }

  function matchPath(pathname) {
    for (const route of routes) {
      const routeParts = route.path.split('/');
      const pathParts = pathname.split('/');
      if (routeParts.length !== pathParts.length) continue;
      let isMatch = true;
      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) continue;
        if (routeParts[i] !== pathParts[i]) { isMatch = false; break; }
      }
      if (isMatch) return true;
    }
    return false;
  }

  return {
    get: (path, handler) => addRoute('GET', path, handler),
    post: (path, handler) => addRoute('POST', path, handler),
    put: (path, handler) => addRoute('PUT', path, handler),
    patch: (path, handler) => addRoute('PATCH', path, handler),
    delete: (path, handler) => addRoute('DELETE', path, handler),
    match,
    matchPath,
  };
}
