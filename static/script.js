document.addEventListener('DOMContentLoaded', function() {
    let currentSlide = 0;
    let logs = [];
    let resultMessage;
    const form = document.getElementById('expression-form');
    const resultSection = document.getElementById('result');
    const resultStage = document.querySelector('.result-stage');
    const resultLog = document.querySelector('.result-log');
    const resultStack = document.querySelector('.result-stack');
    const resultState = document.querySelector('.result-state');
    const prevStageButton = document.getElementById('prev-stage-button');
    const nextStageButton = document.getElementById('next-stage-button');
    const stageTextBottom = document.getElementById('stage-text-bottom');
    const topStageText = document.getElementById('top-stage-text');
    const stageBoxes = document.querySelectorAll('.stage-box');
    const stageTextColors = {'ready-stage': 'var(--yellow-color)', 'run-stage': 'var(--blue-color)', 'finish-stage-green': 'var(--green-color)', 'finish-stage-red': 'var(--red-color)'};
    const appText = document.getElementById('app-text');
    const submitIcon = document.getElementById('submit-icon');
    const submitButton = document.querySelector('.form-button');

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const inputData = document.getElementById('expression').value;
        fetch('/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputData: inputData })
        })
        .then(response => response.json())
        .then(data => {
            logs = data.logs;
            resultMessage = data.message;
            resultSection.style.display = 'flex';
            currentSlide = 0;
            submitIcon.src = 'static/assets/refresh.png';
            showSlides(logs);
        })
        .catch(error => console.error('Error:', error));
    });

    submitButton.addEventListener('click', function(event) {
        if (submitIcon.src.includes('static/assets/refresh.png')) {
            form.reset();
            logs = [];
            currentSlide = 0;
            resultSection.style.display = 'none';
            appText.style.display = 'flex';
            submitIcon.src = 'static/assets/start.png';
            submitButton.style.background = stageTextColors['var(--green-color)'];
            updateTopInfo();
            form.submit();
        }
    });

    function showSlides(logs) {
        updateSlide(currentSlide);
        updateButtonState();
        updateTopInfo();
    }

    function updateTopInfo() {
        if (!logs || logs.length === 0) {
            topStageText.innerHTML = 'İfade Bekleniyor';
            topStageText.style.color = stageTextColors['ready-stage'];
            stageBoxes[1].style.background = "";
            stageBoxes[2].style.background = "";
            stageBoxes[2].style.borderColor = stageTextColors['finish-stage-green'];
            submitButton.style.background = stageTextColors['finish-stage-green'];
        } else if (currentSlide === logs.length - 1) {
            appText.style.display = 'none';
            if(resultMessage === 'Geçerli ifade.'){
                topStageText.innerHTML = 'İfade Kontrol Edildi. Geçerli';
                topStageText.style.color = stageTextColors['finish-stage-green'];
                stageBoxes[2].style.background = stageTextColors['finish-stage-green'];
                submitButton.style.background = stageTextColors['finish-stage-green'];
            }else{
                topStageText.innerHTML = 'İfade Kontrol Edildi. Geçersiz';
                topStageText.style.color = stageTextColors['finish-stage-red'];
                stageBoxes[2].style.background = stageTextColors['finish-stage-red'];
                stageBoxes[2].style.borderColor = stageTextColors['finish-stage-red'];
                submitButton.style.background = stageTextColors['finish-stage-red'];
            }
        } else {
            appText.style.display = 'none';
            topStageText.innerHTML = 'İfade Kontrol Ediliyor';
            stageBoxes[1].style.background = stageTextColors['run-stage'];
            stageBoxes[2].style.background = "";
            stageBoxes[2].style.borderColor = stageTextColors['finish-stage-green'];
            submitButton.style.background = stageTextColors['finish-stage-green'];
            topStageText.style.color = stageTextColors['run-stage'];
        }
    }

    function updateSlide(index) {
        const log = logs[index];
        const stackElements = log.stack.split('').map(item => `<p>${item}</p>`).join('');
        const prevLogState = index > 0 ? logs[index-1].state : "z";
        let explanation;
        if(log.state === 'z'){
            explanation = "<p>İfadeniz hazırlandı<br>İşleme başlayabilirsiniz</p>";
        }else if(log.state === 'f'){
            explanation = "<p>Geçerli ifade<br>Simülasyon tamamlandı</p>";
        }else if(log.state === 'qf'){
            explanation = "<p>Geçersiz ifade<br>Simülasyon sonlandırıldı</p>";
        }else{
            explanation = "<p>Geçerli ifade olabilir<br>Sonraki aşamaya geçebilirsiniz</p>";
        }
        resultStage.innerHTML = `<p>Aşama ${log.stage}/${logs.length}</p><p>${logs.slice(0, log.stage).map(l => l.char).join('')}</p>${explanation}`;
        resultLog.innerHTML = `<p>${logs.slice(0, log.stage).map(l => l.log).join('<br>')}</p>`;
        resultStack.innerHTML = stackElements;
        resultState.innerHTML = `<img src="static/assets/pdaState/${prevLogState}_${log.state}.png" alt="state-image">`;
        stageTextBottom.innerHTML = `<p>Aşama ${log.stage}</p>`;
    }

    function updateButtonState() {
            if (currentSlide === 0) {
                prevStageButton.disabled = true;prevStageButton.classList.add('disabled-button');
            } else {
                prevStageButton.disabled = false;prevStageButton.classList.remove('disabled-button');
            }
            if (currentSlide === logs.length - 1) {
                nextStageButton.disabled = true;nextStageButton.classList.add('disabled-button');
            } else {
                nextStageButton.disabled = false;nextStageButton.classList.remove('disabled-button');
            }
    }

    prevStageButton.addEventListener('click', function() {
        if (currentSlide > 0) {
            currentSlide--;
            updateSlide(currentSlide);updateButtonState();updateTopInfo();
        }
    });

    nextStageButton.addEventListener('click', function() {
        if (currentSlide < logs.length - 1) {
            currentSlide++;
            updateSlide(currentSlide);updateButtonState();updateTopInfo();
        }
    });

    updateTopInfo();updateButtonState();
});

document.getElementById('theme-toggle').addEventListener('click', function() {
    const currentTheme = document.documentElement.getAttribute('theme');
    const appLogo = document.querySelector('.app-logo');
    if (currentTheme === 'light') {document.documentElement.setAttribute('theme', 'dark');appLogo.src = 'static/assets/pdaft_light.png';
    } else {document.documentElement.setAttribute('theme', 'light');appLogo.src = 'static/assets/pdaft_dark.png';
    }
});