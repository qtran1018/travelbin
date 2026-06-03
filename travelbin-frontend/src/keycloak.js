import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'https://auth.quangntran.com',
    realm: 'travel-platform',
    clientId: 'travelbin-frontend',
});

export default keycloak;
