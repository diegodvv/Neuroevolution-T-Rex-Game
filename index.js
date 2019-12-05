var RunnerObj;
function onDocumentLoad() {
    RunnerObj = new Runner('.interstitial-wrapper');
    RunnerObj.subscribe((state) => {
        console.log(state);
    });
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}