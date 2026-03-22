// === CONFIGURAÇÃO INICIAL E USUÁRIO ===
        document.addEventListener('DOMContentLoaded', () => {
            let usuario = JSON.parse(localStorage.getItem('academicflow_session'));
            
            // Se não existir usuário, inicia do NÍVEL 0
            if (!usuario) {
                usuario = {
                    name: 'Novo Estudante',
                    nivel: 0,
                    xpAtual: 0,
                    xpProximoNivel: 100
                };
                localStorage.setItem('academicflow_session', JSON.stringify(usuario));
            }
            
            // Atualiza Interface
            document.getElementById('user-name').textContent = usuario.name;
            document.getElementById('user-avatar').textContent = usuario.name.charAt(0).toUpperCase();
            
            // Inicializa todos os módulos
            initTimer();
            atualizarSelectMeses();
            atualizarGraficoSemanal(); // <--- ESSA LINHA É ESSENCIAL
            gerarRelatorioMensal();
            carregarMaterias();
            carregarArquivos();
            carregarNotas();
            atualizarIndicadoresHoras();
            atualizarProgressoXP();
        });

        // === MÓDULO 1: TIMER POMODORO ===
        function initTimer() {
            const timerDisplay = document.getElementById('timer-display');
            const btnStart = document.getElementById('btn-start');
            const btnPause = document.getElementById('btn-pause');
            const btnReset = document.getElementById('btn-reset');
            const timerRing = document.getElementById('timer-ring');
            
            let timeLeft = 1500;
            let timerInterval = null;
            let isRunning = false;

            const updateDisplay = () => {
                const min = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                const sec = (timeLeft % 60).toString().padStart(2, '0');
                timerDisplay.textContent = `${min}:${sec}`;
            };

            btnStart.addEventListener('click', () => {
                if (isRunning) return;
                isRunning = true;
                timerRing.style.animationPlayState = 'running';
                btnStart.disabled = true;
                btnPause.disabled = false;
                timerInterval = setInterval(() => {
                    if (timeLeft > 0) { timeLeft--; updateDisplay(); }
                    else { clearInterval(timerInterval); showNotification('🎉 Foco Concluído!'); }
                }, 1000);
            });

            btnPause.addEventListener('click', () => {
                clearInterval(timerInterval);
                isRunning = false;
                timerRing.style.animationPlayState = 'paused';
                btnStart.disabled = false;
                btnPause.disabled = true;
            });

            btnReset.addEventListener('click', () => {
                clearInterval(timerInterval);
                isRunning = false;
                timeLeft = 1500;
                updateDisplay();
                timerRing.style.animationPlayState = 'paused';
                btnStart.disabled = false;
                btnPause.disabled = true;
            });
        }

        // === MÓDULO 2: MATÉRIAS (ATUALIZADO COM EXCLUSÃO) ===
        function carregarMaterias() {
            const materias = JSON.parse(localStorage.getItem('academicflow_materias') || '[]');
            const lista = document.getElementById('lista-materias');
            
            lista.innerHTML = materias.map(m => `
                <li class="subject-item">
                    <span class="subject-name">${m.nome}</span>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="subject-tag">${m.dia}</span>
                        <button class="btn-delete" onclick="removerMateria(${m.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.2rem;">&times;</button>
                    </div>
                </li>
            `).join('') || '<li style="text-align:center; opacity:0.5; padding:10px;">Nenhuma matéria.</li>';
            
            atualizarTodosSelects();
        }

        function removerMateria(id) {
            const materias = JSON.parse(localStorage.getItem('academicflow_materias') || '[]');
            const materiaParaRemover = materias.find(m => m.id === id);

            if (!confirm(`Deseja excluir "${materiaParaRemover.nome}"? Isso removerá também notas e arquivos desta matéria.`)) return;

            // 1. Remove a Matéria
            const novasMaterias = materias.filter(m => m.id !== id);
            localStorage.setItem('academicflow_materias', JSON.stringify(novasMaterias));

            // 2. Limpeza em cascata (Opcional, mas recomendado)
            const nomeMateria = materiaParaRemover.nome;
            
            let notas = JSON.parse(localStorage.getItem('academicflow_notas') || '[]');
            localStorage.setItem('academicflow_notas', JSON.stringify(notas.filter(n => n.materia !== nomeMateria)));

            let arquivos = JSON.parse(localStorage.getItem('academicflow_arquivos') || '[]');
            localStorage.setItem('academicflow_arquivos', JSON.stringify(arquivos.filter(a => a.materia !== nomeMateria)));

            // 3. Atualiza tudo
            carregarMaterias();
            carregarNotas();
            carregarArquivos();
            showNotification('🗑️ Matéria e dados vinculados removidos!');
        }

        // === MÓDULO 3: HORAS E XP (GAMIFICAÇÃO) ===
        // ATUALIZAÇÃO DA FUNÇÃO DE REGISTRO
        function registrarEstudo() {
            const dia = document.getElementById('select-dia-registro').value;
            const horas = parseFloat(document.getElementById('input-horas').value);
            const materia = document.getElementById('select-materia-horas').value; // Captura a matéria selecionada

            if (isNaN(horas) || horas <= 0) return alert("Insira as horas corretamente!");

            const registros = JSON.parse(localStorage.getItem('academicflow_registros') || '[]');
            registros.push({
                id: Date.now(),
                dia: dia,
                horas: horas,
                materia: materia, // Salva o nome da matéria no registro
                data: new Date().toLocaleDateString('pt-BR')
            });

            localStorage.setItem('academicflow_registros', JSON.stringify(registros));
            document.getElementById('input-horas').value = '';

            atualizarGraficoSemanal();
            gerarRelatorioMensal();
            ganharXP(horas * 10);
            carregarListaRegistros(); // Atualiza a lista abaixo do gráfico

            showNotification(`🕒 ${horas}h de ${materia} registradas!`);
        }

        // ATUALIZAÇÃO DA LISTA DE REGISTROS (Para mostrar a matéria)
        function carregarListaRegistros() {
            const registros = JSON.parse(localStorage.getItem('academicflow_registros') || '[]');
            const lista = document.getElementById('lista-registros-horas');
            if (!lista) return;

            const ultimosRegistros = [...registros].reverse().slice(0, 5);

            lista.innerHTML = ultimosRegistros.map(reg => `
                <li class="record-item">
                    <div class="record-info">
                        <strong>${reg.horas}h</strong> de <span style="color:var(--accent-primary)">${reg.materia}</span> em ${reg.dia}
                    </div>
                    <button class="btn-delete" onclick="removerRegistroHora(${reg.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.1rem;">&times;</button>
                </li>
            `).join('') || '<li style="text-align:center; opacity:0.5; font-size:0.75rem;">Nenhum registro.</li>';
        }

        function ganharXP(quantidade) {
            let u = JSON.parse(localStorage.getItem('academicflow_session'));
            u.xpAtual += quantidade;

            // Level Up
            while (u.xpAtual >= u.xpProximoNivel) {
                u.xpAtual -= u.xpProximoNivel;
                u.nivel += 1;
                u.xpProximoNivel = Math.floor(u.xpProximoNivel * 1.5);
                alert(`🎉 Parabéns! Você subiu para o Nível ${u.nivel}!`);
            }

            localStorage.setItem('academicflow_session', JSON.stringify(u));
            atualizarProgressoXP();
        }

        function atualizarProgressoXP() {
            const u = JSON.parse(localStorage.getItem('academicflow_session'));
            document.getElementById('user-nivel').textContent = u.nivel;
            document.getElementById('user-xp').textContent = `${u.xpAtual} / ${u.xpProximoNivel}`;
            const pct = (u.xpAtual / u.xpProximoNivel) * 100;
            document.getElementById('barra-xp').style.width = pct + '%';
            document.getElementById('xp-proximo').textContent = `${u.xpProximoNivel - u.xpAtual} XP`;
        }

        function atualizarIndicadoresHoras() {
            const registros = JSON.parse(localStorage.getItem('academicflow_registros') || '[]');
            const total = registros.reduce((acc, r) => acc + r.horas, 0);
            document.getElementById('total-horas').textContent = total.toFixed(1) + 'h';
            document.getElementById('total-horas-totais').textContent = total.toFixed(1) + 'h';
            
            // Atualiza barras do gráfico (exemplo simplificado)
            const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
            dias.forEach(d => {
                const hDia = registros.filter(r => r.dia === d).reduce((acc, r) => acc + r.horas, 0);
                const bar = document.getElementById(`bar-${d.toLowerCase().replace('á','a')}`);
                if(bar) {
                    bar.style.height = Math.min(hDia * 10, 100) + '%';
                    bar.classList.toggle('active-bar', hDia > 0);
                    bar.setAttribute('data-horas', hDia);
                }
            });
        }

        // Funções Auxiliares de UI
        function showNotification(msg) {
            let n = document.querySelector('.notification');
            if(!n) { n = document.createElement('div'); n.className = 'notification'; document.body.appendChild(n); }
            n.textContent = msg; n.classList.add('show');
            setTimeout(() => n.classList.remove('show'), 3000);
        }

        function fazerLogout() { 
            if(confirm('Sair?')) { localStorage.removeItem('academicflow_session'); window.location.href = 'index.html'; }
        }

        // === MÓDULO 4: ARQUIVOS DE ESTUDO (ATUALIZADO) ===
        function carregarArquivos() {
            const arquivos = JSON.parse(localStorage.getItem('academicflow_arquivos') || '[]');
            const lista = document.getElementById('lista-arquivos');
            const filtro = document.getElementById('filtro-materia-arquivo').value;

            const arquivosFiltrados = filtro === 'todas' 
                ? arquivos 
                : arquivos.filter(a => a.materia === filtro);

            lista.innerHTML = arquivosFiltrados.map(arq => `
                <li class="file-item">
                    <div class="file-info">
                        <span class="file-icon">📄</span>
                        <div>
                            <div class="file-name">${arq.nome}</div>
                            <div class="file-meta">${arq.materia} • ${arq.data}</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn-download" onclick="window.open('${arq.url || '#'}', '_blank')">Abrir</button>
                        <button class="btn-delete" onclick="removerArquivo(${arq.id})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.2rem; font-weight: bold;">&times;</button>
                    </div>
                </li>
            `).join('') || '<li style="text-align:center; opacity:0.5; padding:10px;">Nenhum arquivo.</li>';
        }

        function anexarArquivo() {
            const materia = document.getElementById('select-materia-arquivo').value;
            const input = document.getElementById('input-arquivo');
            
            if (!materia || !input.files[0]) return alert('Selecione a matéria e o arquivo!');

            const novoArquivo = {
                id: Date.now(),
                nome: input.files[0].name,
                materia: materia,
                data: new Date().toLocaleDateString()
            };

            const arquivos = JSON.parse(localStorage.getItem('academicflow_arquivos') || '[]');
            arquivos.push(novoArquivo);
            localStorage.setItem('academicflow_arquivos', JSON.stringify(arquivos));
            
            input.value = '';
            carregarArquivos();
            showNotification('📎 Arquivo anexado com sucesso!');
        }

        // === MÓDULO 5: NOTAS (ATUALIZADO COM UNIDADES E CORES) ===
        function carregarNotas() {
            const notas = JSON.parse(localStorage.getItem('academicflow_notas') || '[]');
            const lista = document.getElementById('lista-notas');
            const filtro = document.getElementById('filtro-materia-notas').value;

            const notasFiltradas = filtro === 'todas' ? notas : notas.filter(n => n.materia === filtro);

            lista.innerHTML = notasFiltradas.map(n => {
                // Lógica de cor dinâmica para a nota
                let corNota = '#4ade80'; // Verde (padrão)
                if (n.nota < 5) corNota = '#ef4444'; // Vermelho
                else if (n.nota < 7) corNota = '#f59e0b'; // Amarelo/Laranja

                return `
                    <li class="grade-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px;">
                        <div>
                            <div class="grade-info-text" style="font-weight: 600; color: #fff;">${n.materia}</div>
                            <div class="grade-subtext" style="font-size: 0.75rem; color: #94a3b8;">${n.unidade}</div>
                        </div>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <span class="grade-badge" style="background: ${corNota}; color: #0f172a; padding: 4px 10px; border-radius: 8px; font-weight: 800;">
                                ${n.nota.toFixed(1)}
                            </span>
                            <button class="btn-delete" onclick="removerNota(${n.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.2rem; transition: 0.2s;">&times;</button>
                        </div>
                    </li>
                `;
            }).join('') || '<li style="text-align:center; opacity:0.5; padding:10px;">Nenhuma nota lançada.</li>';
        }

        function removerNota(id) {
            if (!confirm('Excluir esta nota?')) return;
            let notas = JSON.parse(localStorage.getItem('academicflow_notas') || '[]');
            notas = notas.filter(n => n.id !== id);
            localStorage.setItem('academicflow_notas', JSON.stringify(notas));
            carregarNotas();
            showNotification('📉 Nota removida!');
        }

        function adicionarNota() {
            const materia = document.getElementById('select-materia-nota').value;
            const unidade = document.getElementById('select-unidade-nota').value;
            const nota = parseFloat(document.getElementById('input-nota').value);

            if (!materia || isNaN(nota)) return alert('Preencha a matéria e a nota corretamente!');

            const notas = JSON.parse(localStorage.getItem('academicflow_notas') || '[]');
            notas.push({ id: Date.now(), materia, unidade, nota });
            localStorage.setItem('academicflow_notas', JSON.stringify(notas));

            document.getElementById('input-nota').value = '';
            carregarNotas();
            showNotification('📊 Nota lançada no sistema!');
        }

        function atualizarTodosSelects() {
            const materias = JSON.parse(localStorage.getItem('academicflow_materias') || '[]');
            const IDs = [
                'select-materia-arquivo', 
                'filtro-materia-arquivo', 
                'select-materia-nota', 
                'filtro-materia-notas'
            ];

            IDs.forEach(id => {
                const select = document.getElementById(id);
                if (!select) return;
                
                // Mantém a primeira opção (ex: "Selecione...") e limpa o resto
                const primeiraOpcao = select.options[0];
                select.innerHTML = '';
                select.add(primeiraOpcao);

                materias.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.nome;
                    opt.textContent = m.nome;
                    select.add(opt);
                });
            });
        }

        // === MÓDULO 6: RELATÓRIO MENSAL, METAS E GRÁFICO DINÂMICO ===

        function atualizarSelectMeses() {
            const select = document.getElementById('select-mes-relatorio');
            if (!select) return;
            
            const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            const dataAtual = new Date();
            const anoAtual = dataAtual.getFullYear();

            select.innerHTML = '';
            for (let i = 0; i < 12; i++) {
                const opt = document.createElement('option');
                const mesValor = (i + 1).toString().padStart(2, '0');
                opt.value = `${anoAtual}-${mesValor}`;
                opt.textContent = `${meses[i]} ${anoAtual}`;
                if (i === dataAtual.getMonth()) opt.selected = true;
                select.appendChild(opt);
            }
        }

        // ESTA FUNÇÃO ATUALIZA O GRÁFICO DE BARRAS
        function obterNumeroSemana(data) {
            const d = new Date(data);
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() + 4 - (d.getDay() || 7));
            const anoInicio = new Date(d.getFullYear(), 0, 1);
            return Math.ceil((((d - anoInicio) / 86400000) + 1) / 7);
        }

        function atualizarGraficoSemanal() {
            const registros = JSON.parse(localStorage.getItem('academicflow_registros') || '[]');
            const dataHoje = new Date();
            const semanaAtual = obterNumeroSemana(dataHoje);
            const anoAtual = dataHoje.getFullYear();

            const diasMapa = {
                'Segunda': 'bar-segunda', 'Terça': 'bar-terca', 'Quarta': 'bar-quarta',
                'Quinta': 'bar-quinta', 'Sexta': 'bar-sexta', 'Sábado': 'bar-sabado', 'Domingo': 'bar-domingo'
            };

            const totaisSemana = { 'Segunda': 0, 'Terça': 0, 'Quarta': 0, 'Quinta': 0, 'Sexta': 0, 'Sábado': 0, 'Domingo': 0 };

            registros.forEach(reg => {
                // Converte string "DD/MM/AAAA" para objeto Date
                const partes = reg.data.split('/');
                const dataReg = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
                
                // SÓ SOMA NO GRÁFICO SE FOR DA SEMANA ATUAL
                if (obterNumeroSemana(dataReg) === semanaAtual && dataReg.getFullYear() === anoAtual) {
                    if (totaisSemana[reg.dia] !== undefined) {
                        totaisSemana[reg.dia] += reg.horas;
                    }
                }
            });

            // Atualiza as barras visualmente (O que não for desta semana ficará com 0% no gráfico)
            for (const [dia, id] of Object.entries(diasMapa)) {
                const barra = document.getElementById(id);
                if (barra) {
                    const horasTotal = totaisSemana[dia];
                    const altura = Math.min(horasTotal * 12.5, 100); 
                    barra.style.height = `${altura}%`;
                    barra.setAttribute('data-horas', horasTotal.toFixed(1));
                    
                    if (horasTotal > 0) barra.classList.add('active-bar');
                    else barra.classList.remove('active-bar');
                }
            }

            // O Relatório Mensal e o Total Geral continuam lendo TODOS os registros normalmente
            const totalGeral = registros.reduce((acc, r) => acc + r.horas, 0);
            if (document.getElementById('total-horas')) {
                document.getElementById('total-horas').textContent = `${totalGeral.toFixed(1)}h`;
            }
        }

        // ESTA FUNÇÃO ATUALIZA O RELATÓRIO MENSAL
        function gerarRelatorioMensal() {
            const select = document.getElementById('select-mes-relatorio');
            if (!select) return;
            
            const mesSelecionado = select.value;
            const registros = JSON.parse(localStorage.getItem('academicflow_registros') || '[]');

            const registrosFiltrados = registros.filter(r => {
                const partes = r.data.split('/'); // DD/MM/AAAA
                return `${partes[2]}-${partes[1]}` === mesSelecionado;
            });

            const totalHoras = registrosFiltrados.reduce((acc, r) => acc + r.horas, 0);
            const mediaDia = totalHoras / 30;
            const meta = 60; 
            const porcentagem = Math.min((totalHoras / meta) * 100, 100);

            document.getElementById('relatorio-total-horas').textContent = `${totalHoras.toFixed(1)}h`;
            document.getElementById('relatorio-media-dia').textContent = `${mediaDia.toFixed(1)}h`;
            
            const barra = document.getElementById('barra-progresso-mes');
            if (barra) {
                barra.style.width = `${porcentagem}%`;
                barra.style.background = porcentagem >= 100 ? '#22c55e' : 'var(--accent-primary)';
            }
            document.getElementById('progresso-texto').textContent = `${porcentagem.toFixed(0)}% concluído`;
        }

        // === ATUALIZAÇÃO DOS GATILHOS ===

        function adicionarMateria() {
            // ... seu código de salvar matéria ...
            atualizarTodosSelects(); 
        }

        function registrarEstudo() {
            const dia = document.getElementById('select-dia-registro').value;
            const horas = parseFloat(document.getElementById('input-horas').value);
            const materia = document.getElementById('input-materia-registro').value || "Geral";

            if (isNaN(horas) || horas <= 0) return alert("Insira as horas corretamente!");

            const registros = JSON.parse(localStorage.getItem('academicflow_registros') || '[]');
            registros.push({
                id: Date.now(),
                dia: dia,
                horas: horas,
                materia: materia,
                data: new Date().toLocaleDateString('pt-BR')
            });

            localStorage.setItem('academicflow_registros', JSON.stringify(registros));
            document.getElementById('input-horas').value = '';

            // ATUALIZA OS DOIS MÓDULOS NA HORA
            atualizarGraficoSemanal();
            gerarRelatorioMensal();
            ganharXP(horas * 10);
            carregarListaRegistros();
            showNotification(`🕒 ${horas}h registradas!`);
        }

        // Função para listar os registros no card
        function carregarListaRegistros() {
            const registros = JSON.parse(localStorage.getItem('academicflow_registros') || '[]');
            const lista = document.getElementById('lista-registros-horas');
            if (!lista) return;

            // Mostra os últimos 5 registros (do mais novo para o mais antigo)
            const ultimosRegistros = [...registros].reverse().slice(0, 5);

            lista.innerHTML = ultimosRegistros.map(reg => `
                <li class="record-item">
                    <div class="record-info">
                        <strong>${reg.horas}h</strong> em ${reg.dia}
                    </div>
                    <button class="btn-delete" onclick="removerRegistroHora(${reg.id})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1.1rem;">&times;</button>
                </li>
            `).join('') || '<li style="text-align:center; opacity:0.5; font-size:0.75rem;">Nenhum registro.</li>';
        }

        // Função para remover e atualizar tudo
        function removerRegistroHora(id) {
            if (!confirm('Deseja apagar este registro de horas?')) return;

            let registros = JSON.parse(localStorage.getItem('academicflow_registros') || '[]');
            const registroParaRemover = registros.find(r => r.id === id);

            if (registroParaRemover) {
                // 1. Diminuir o XP proporcionalmente (10 XP por hora)
                perderXP(registroParaRemover.horas * 10);

                // 2. Remover do array
                registros = registros.filter(r => r.id !== id);
                localStorage.setItem('academicflow_registros', JSON.stringify(registros));

                // 3. Atualizar Interface e Gráfico
                atualizarGraficoSemanal();
                carregarListaRegistros();
                gerarRelatorioMensal();
                showNotification('🕒 Registro removido!');
            }
        }

        // Função auxiliar para ajustar o XP ao remover horas
        function perderXP(quantidade) {
            let u = JSON.parse(localStorage.getItem('academicflow_session'));
            u.xpAtual -= quantidade;

            // Se o XP ficar negativo, ele volta ao nível anterior ou trava em 0
            if (u.xpAtual < 0) {
                if (u.nivel > 0) {
                    u.nivel -= 1;
                    // Recalcula o XP necessário para o nível anterior (aproximadamente)
                    u.xpProximoNivel = Math.floor(u.xpProximoNivel / 1.5);
                    u.xpAtual = u.xpProximoNivel + u.xpAtual;
                } else {
                    u.xpAtual = 0;
                }
            }
            localStorage.setItem('academicflow_session', JSON.stringify(u));
            atualizarProgressoXP();
        }

        async function enviarPerguntaIA() {
        const input = document.getElementById('ai-user-input');
        const msg = input.value.trim();
        
        // 1. Se não tiver mensagem, não faz nada
        if (!msg) return;

        // 2. Mostra a mensagem do usuário no chat
        renderizarMensagem(msg, 'user');
        input.value = '';

        // 3. Tenta pegar as matérias do LocalStorage
        let materiasParaEnviar = ["Geral"];
        try {
            const salvas = JSON.parse(localStorage.getItem('academicflow_materias') || '[]');
            if (salvas.length > 0) {
                materiasParaEnviar = salvas.map(m => typeof m === 'object' ? m.nome : m);
            }
        } catch (e) {
            console.log("Erro ao ler matérias, usando padrão 'Geral'");
        }

        // 4. Mostra uma mensagem de "carregando"
        const mensagemPensando = renderizarMensagem("Estou pensando...", 'bot');

        try {
            // 5. Faz a chamada para o servidor
            const response = await fetch('http://localhost:3000/perguntar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    pergunta: msg, 
                    contexto: { 
                        materias: materiasParaEnviar
                    } 
                })
            });

            const data = await response.json();

            // 6. Atualiza a mensagem de "pensando" com a resposta real
            if (data.resposta) {
                mensagemPensando.innerText = data.resposta;
            } else {
                mensagemPensando.innerText = "Tive um problema com a resposta da IA: " + (data.error || "Erro desconhecido");
            }

        } catch (error) {
            console.error("Erro de conexão:", error);
            mensagemPensando.innerText = "Erro: O servidor está desligado ou houve falha na conexão.";
        }
    }

    function renderizarMensagem(texto, remetente) {
        const container = document.getElementById('chat-container');
        if (!container) return;

        const div = document.createElement('div');
        div.className = `ai-message ${remetente}`;
        div.innerText = texto;
        container.appendChild(div);
        
        // Scroll automático
        container.scrollTop = container.scrollHeight;
        
        return div;
    }