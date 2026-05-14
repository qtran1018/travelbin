import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://localhost:8180',
    realm: 'travel-platform',
    clientId: 'travelbin-frontend',
});

export default keycloak;
