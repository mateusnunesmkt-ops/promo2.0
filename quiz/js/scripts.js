/* Quiz Shopee - controle de perguntas, progresso e navegação */
(function () {
    "use strict";

    var TOTAL_STEPS = 6;          // p1..p5 = perguntas | p6 = resultado
    var LAST_QUESTION = 5;        // última pergunta que exige resposta
    var current = 1;
    var answered = {};            // step -> true quando o usuario escolhe uma opcao

    var nextBtn, progressEl, progressText, headerEl, barEl;

    function updateProgress() {
        var pct = (current / TOTAL_STEPS) * 100;
        if (progressEl) progressEl.style.width = pct + "%";
        if (progressText) progressText.textContent = Math.round(pct) + " %";
    }

    function updateButton() {
        if (!nextBtn) return;
        if (current >= TOTAL_STEPS) {
            nextBtn.textContent = "Ir para o site";
            nextBtn.disabled = false;
        } else {
            nextBtn.textContent = "Próximo";
            nextBtn.disabled = !answered[current];
        }
    }

    function showStep(step) {
        for (var i = 1; i <= TOTAL_STEPS; i++) {
            var el = document.getElementById("p" + i);
            if (el) el.style.display = (i === step) ? "block" : "none";
        }

        // No resultado (p6) esconde cabecalho e barra de progresso
        if (step >= TOTAL_STEPS) {
            if (headerEl) headerEl.style.display = "none";
            if (barEl) barEl.style.display = "none";
        } else {
            if (headerEl) headerEl.style.display = "";
            if (barEl) barEl.style.display = "";
        }

        updateProgress();
        updateButton();
        try { window.scrollTo(0, 0); } catch (e) {}
    }

    function bindOptions() {
        for (var step = 1; step <= LAST_QUESTION; step++) {
            (function (step) {
                var container = document.getElementById("p" + step);
                if (!container) return;
                var buttons = container.querySelectorAll(".quiz-options button");
                Array.prototype.forEach.call(buttons, function (btn) {
                    btn.addEventListener("click", function () {
                        Array.prototype.forEach.call(buttons, function (b) {
                            b.style.borderColor = "#ccc";
                            b.style.backgroundColor = "#fff";
                            b.style.color = "#555";
                        });
                        btn.style.borderColor = "#EE4D2D";
                        btn.style.backgroundColor = "#EE4D2D";
                        btn.style.color = "#fff";
                        answered[step] = true;
                        updateButton();
                    });
                });
            })(step);
        }
    }

    // Exposta no onclick do botao "Próximo"
    window.nextQuestion = function () {
        if (current < TOTAL_STEPS) {
            if (!answered[current]) return;   // trava: precisa responder
            current++;
            showStep(current);
        } else {
            var qs = window.location.search || "";
            window.location.href = "../index.html" + qs;
        }
    };

    function init() {
        nextBtn = document.getElementById("next-button");
        progressEl = document.getElementById("progress");
        progressText = document.getElementById("progress-text");
        headerEl = document.getElementById("respondaeganhe");
        barEl = document.getElementById("barradeprogresso");

        bindOptions();
        showStep(current);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
