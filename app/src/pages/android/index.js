import * as Y from 'yjs';
import { syncedStore, getYjsDoc } from '@syncedstore/core';
import { MatrixProvider } from '@unimo/matrix-crdt';
import { useEffect } from 'react';
import sdk from 'matrix-js-sdk';
export let crypto = global.window?.crypto;
export default function Android() {
    const userIdPath = 'synapse.nas.s4fu.com';
    const baseUrl = 'https://synapse.nas.s4fu.com';
    const roomAlias = '#test1:synapse.nas.s4fu.com';

    const store = syncedStore({ counters: [] });
    const doc = getYjsDoc(store);
    if (!crypto) {
        try {
            crypto = require('crypto').webcrypto;
        } catch (e) {
            logger.error('Failed to load webcrypto', e);
        }
    }
    let provider;
    let login = false;
    let accessToken = false;

    let matrixClient = null;
    let run = 0;

    const init = async () => {
        run++;
        if (run > 1) return;
        // fix this as for some reason useEffect (re-render) is called twice
        console.log = (message) => {
            let node = document.createElement('li'); // Create a <li> node
            let textnode = document.createTextNode(message); // Create a text node
            node.appendChild(textnode); // Append the text to <li>

            document.getElementById('myList').appendChild(node);
        };
        console.error = (message) => {
            let node = document.createElement('li'); // Create a <li> node
            let textnode = document.createTextNode(message); // Create a text node
            node.appendChild(textnode); // Append the text to <li>
            node.style.color = 'red';
            document.getElementById('myList').appendChild(node); // Append <li> to <ul> with id="myList"
        };
        console.log('login: ' + login);
        console.log('token: ' + accessToken);
        provider = new MatrixProvider(doc, matrixClient, {
            type: 'alias',
            alias: roomAlias,
        });
        await provider.initialize();
        const device = matrixClient.getDeviceId();
        const timestamp = Date.now();
        store.counters.push({ deviceId: device, timestamp: timestamp });
        console.log('dump:' + JSON.stringify(store.counters.toJSON(), null, 2));
    };

    useEffect(() => {
        let params = new URLSearchParams(window.location.search);
        login = params.get('login');
        accessToken = params.get('token');
        if (!login || !accessToken) return;
        matrixClient = sdk.createClient({
            baseUrl: baseUrl,
            deviceId: 'android-webview' + '_' + login,
            accessToken: accessToken,
            userId: '@' + login + ':' + userIdPath,
            isVoipWithNoMediaAllowed: false,
        });
        init().catch(console.error);
    }, []);
    return (
        <div>
            Android
            <ul id='myList'></ul>
        </div>
    );
}
