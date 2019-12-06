var RunnerObj;
function onDocumentLoad() {
    RunnerObj = new Runner('.interstitial-wrapper', Runner.config, (runnerInstance) => GeneticAlgorithm(runnerInstance));
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);