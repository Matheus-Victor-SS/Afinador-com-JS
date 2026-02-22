# 🎵 Afinador Cromático Online

Um afinador cromático moderno feito com **HTML, CSS e JavaScript**, usando a Web Audio API para detectar frequência em tempo real pelo microfone.

Projetado principalmente para **uso em celular**, com interface limpa, visual moderna e animações suaves.

---

## 📱 Demonstração

* Interface escura moderna
* Nota grande e central
* Barra visual com zona verde fixa
* Ponteiro animado suave
* Indicador visual quando está afinado
* Alternância entre ♭ Bemol e ♯ Sustenido

---

## 🚀 Funcionalidades

### 🎯 Detecção em Tempo Real

Detecta frequência usando o microfone do dispositivo.

### 🎵 Afinador Cromático Completo

Reconhece todas as 12 notas:
Dó, Ré♭/Dó#, Ré, Mi♭/Ré#, Mi, Fá, Sol♭/Fá#, Sol, Lá♭/Sol#, Lá, Si♭/Lá#, Si.

### 🔁 Alternar Bemol / Sustenido

Botão para escolher preferência:

* ♭ Bemol (padrão)
* ♯ Sustenido

### 📊 Barra Visual Profissional

* Zona verde fixa no centro
* Ponteiro animado suavemente
* Nota fica verde quando afinada

### 📱 Otimizado para Celular

* Layout centralizado
* Botões grandes
* Interface simples e limpa
* Animações suaves

---

## 🧠 Como Funciona

O afinador utiliza:

* `getUserMedia()` para acessar o microfone
* `AudioContext` da Web Audio API
* Algoritmo de autocorrelação para detectar frequência
* Conversão de frequência para nota musical
* Cálculo de diferença em cents para medir afinação

---

## 🛠 Tecnologias Utilizadas

* HTML5
* CSS3
* JavaScript
* Web Audio API

---

## ⚙ Como Usar

1. Abra o projeto no navegador (Chrome recomendado)
2. Clique em **Iniciar Afinador**
3. Permita acesso ao microfone
4. Faça um som ou toque uma nota
5. Ajuste até o ponteiro ficar na zona verde

---

## 👨‍💻 Autor

Desenvolvido por Matheus Victor
Projeto criado para estudo e prática de JavaScript e áudio em tempo real.
