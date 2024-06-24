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
    const prevButton = document.getElementById('prev-stage-button');
    const nextButton = document.getElementById('next-stage-button');
    const stageTextBottom = document.getElementById('stage-text-bottom');
    const topStageText = document.getElementById('top-stage-text');
    const boxes = document.querySelectorAll('.stage-box');
    const colors = {'ready': 'var(--yellow-color)', 'run': 'var(--blue-color)', 'green': 'var(--green-color)', 'red': 'var(--red-color)'};
    const appText = document.getElementById('app-text');
    const submitIcon = document.getElementById('submit-icon');
    const submitButton = document.querySelector('.form-button');

    const refresh = 'static/assets/refresh.png';
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
                submitIcon.src = refresh;
                showSlides();
            })
            .catch(error => console.error('Error:', error));
    });

    submitButton.addEventListener('click', function(event) {
        if (submitIcon.src.includes(refresh)) {
            form.reset();
            logs = [];
            currentSlide = 0;
            resultSection.style.display = 'none';
            appText.style.display = 'flex';
            submitIcon.src = 'static/assets/start.png';
            submitButton.style.background = colors['green'];
            updateTopInfo();
            form.submit();
        }
    });

    function showSlides() {
        updateSlide();
        updateButtonState();
        updateTopInfo();
    }

    function updateTopInfo() {

        function setTopStageText(text, color) {
            topStageText.textContent = text;
            topStageText.style.color = color;
        }

        function setBoxBackgroundColor(boxIndex, color) {
            boxes[boxIndex].style.background = color;
        }

        function setSubmitButtonColor(color) {
            submitButton.style.background = color;
        }

        if (!logs.length) {
            setTopStageText('İfade Bekleniyor', colors['ready']);
            setBoxBackgroundColor(1, "");
            setBoxBackgroundColor(2, "");
            boxes[2].style.borderColor = colors['green'];
            setSubmitButtonColor(colors['green']);
        } else if (currentSlide === logs.length - 1) {
            appText.style.display = 'none';
            if (resultMessage === 'Geçerli ifade.') {
                setTopStageText('İfade Kontrol Edildi. Geçerli', colors['green']);
                setBoxBackgroundColor(2, colors['green']);
                setSubmitButtonColor(colors['green']);
            } else {
                setTopStageText('İfade Kontrol Edildi. Geçersiz', colors['red']);
                setBoxBackgroundColor(2, colors['red']);
                boxes[2].style.borderColor = colors['red'];
                setSubmitButtonColor(colors['red']);
            }
        } else {
            appText.style.display = 'none';
            setTopStageText('İfade Kontrol Ediliyor', colors['run']);
            setBoxBackgroundColor(1, colors['run']);
            setBoxBackgroundColor(2, "");
            boxes[2].style.borderColor = colors['green'];
            setSubmitButtonColor(colors['green']);
        }
    }


    function updateSlide() {
        const log = logs[currentSlide];
        const stackElements = log.stack.split('').map(item => `<p>${item}</p>`).join('');
        const prevLogState = currentSlide > 0 ? logs[currentSlide-1].state : "z";
        let explanation;

        switch(log.state) {
            case 'z':
                explanation = "<p>İfadeniz hazırlandı<br>İşleme başlayabilirsiniz</p>";
                break;
            case 'f':
                explanation = "<p>Geçerli ifade<br>Simülasyon tamamlandı</p>";
                break;
            case 'qf':
                explanation = "<p>Geçersiz ifade<br>Simülasyon sonlandırıldı</p>";
                break;
            default:
                explanation = "<p>Geçerli ifade olabilir<br>Sonraki aşamaya geçebilirsiniz</p>";
        }
        resultStage.innerHTML = `<p>Aşama ${log.stage}/${logs.length}</p><p>${logs.slice(0, log.stage).map(l => l.char).join('')}</p>${explanation}`;
        resultLog.innerHTML = `<p>${logs.slice(0, log.stage).map(l => l.log).join('<br>')}</p>`;
        resultStack.innerHTML = stackElements;
        resultState.innerHTML = `<img src="static/assets/pdaState/${prevLogState}_${log.state}.png" alt="state-image">`;
        stageTextBottom.innerHTML = `<p>Aşama ${log.stage}</p>`;
    }

    function updateButtonState() {
        prevButton.disabled = currentSlide === 0;
        nextButton.disabled = currentSlide === logs.length - 1;
        prevButton.classList.toggle('disabled-button', currentSlide === 0);
        nextButton.classList.toggle('disabled-button', currentSlide === logs.length - 1);
    }

    prevButton.addEventListener('click', function() {
        if (currentSlide > 0) {
            currentSlide--;
            updateSlide();
            updateButtonState();
            updateTopInfo();
        }
    });

    nextButton.addEventListener('click', function() {
        if (currentSlide < logs.length - 1) {
            currentSlide++;
            updateSlide();
            updateButtonState();
            updateTopInfo();
        }
    });

    updateTopInfo();
    updateButtonState();
});

document.getElementById('theme-toggle').addEventListener('click', function() {
    const currentTheme = document.documentElement.getAttribute('theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    const appLogoSrc = newTheme === 'dark' ? 'static/assets/pdaft_light.png' : 'static/assets/pdaft_dark.png';
    document.documentElement.setAttribute('theme', newTheme);
    document.querySelector('.app-logo').src = appLogoSrc;
});