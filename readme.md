# Sistema de Rifas Online

## Objetivo

Criar um sistema de rifas online extremamente simples, rápido e funcional.

Hoje o controle é manual, e o objetivo é automatizar:
- seleção de números
- bloqueio em tempo real
- controle das rifas
- visualização dos participantes

O foco NÃO é criar um sistema enterprise complexo.

O foco é:
- simplicidade
- velocidade
- UX intuitiva
- realtime
- estabilidade
- facilidade de uso

---

# Stack Obrigatória

## Frontend
- React
- Vite

## Backend / Database
- Firebase
  - Firestore
  - Realtime listeners
  - Firebase Hosting opcional

## Deploy
- Vercel

---

# MUITO IMPORTANTE

## Frontend

O frontend DEVE ser feito utilizando a skill/frontenddesign.

Quero um frontend:
- extremamente limpo
- minimalista
- moderno
- muito bonito
- extremamente rápido
- fácil de entender
- sem poluição visual
- sem dashboards corporativos
- sem excesso de componentes
- sem animações pesadas
- sem ladainha visual

Prioridade absoluta:
- velocidade
- clareza
- simplicidade
- UX intuitiva

---

# Funcionalidade Principal

## Fluxo do Usuário

1. Usuário abre o link da rifa
2. Visualiza os números disponíveis
3. Clica em um número
4. Preenche:
   - nome
   - telefone
5. Confirma
6. Número fica indisponível instantaneamente

---

# Realtime (OBRIGATÓRIO)

O sistema deve atualizar em tempo real.

Exemplo:
- 10 pessoas estão na tela
- uma pessoa seleciona o número 52
- imediatamente todos veem o número indisponível

Sem refresh.

Utilizar:
- Firebase realtime listeners
- onSnapshot

---

# Concorrência (MUITO IMPORTANTE)

O sistema DEVE impedir que duas pessoas peguem o mesmo número.

Obrigatório utilizar:
- transaction
OU
- atomic update

Fluxo:
1. verificar se número ainda está disponível
2. somente então salvar reserva

Mesmo com múltiplos usuários simultâneos.

---

# Estados dos Números

Cada número deve possuir estados visuais.

## Estados obrigatórios

### Disponível
- verde/neutro

### Reservado Temporariamente
- usuário clicou mas ainda não finalizou

### Aguardando Pagamento
- usuário confirmou os dados

### Pago
- confirmado pelo admin

---

# Reserva Temporária (OBRIGATÓRIO)

Quando usuário clicar:
- número fica reservado temporariamente
- expiração automática: 3 minutos

Se o usuário abandonar:
- número volta automaticamente para disponível

---

# Estrutura das Rifas

Cada rifa deve possuir:
- id único
- título
- descrição opcional
- quantidade de números
- status (ativa/finalizada)

---

# Estrutura Recomendada Firestore

```txt
rifas/
   rifaId/
      metadata

      numeros/
         numeroId
```

Exemplo documento do número:

```json
{
  "numero": 52,
  "status": "disponivel",
  "nome": "",
  "telefone": "",
  "createdAt": "",
  "expiresAt": ""
}
```

---

# Tela da Rifa

## Deve conter

- título da rifa
- grid de números
- indicador visual dos estados
- modal simples para preenchimento
- atualização instantânea

---

# Design da Tela

O design deve priorizar:
- mobile first
- carregamento instantâneo
- poucos elementos
- grid responsiva
- leitura rápida
- acessibilidade
- UX extremamente intuitiva

---

# NÃO fazer

Não quero:
- excesso de efeitos
- animações desnecessárias
- telas complexas
- menus gigantes
- dashboard empresarial
- componentes pesados
- bibliotecas desnecessárias

---

# Painel Admin

Criar painel admin simples.

## Funcionalidades:
- criar rifa
- definir quantidade de números
- visualizar participantes
- marcar pagamento
- cancelar reserva
- finalizar rifa

---

# Segurança

## Admin
- acesso protegido

## Usuários
- sem necessidade de login inicialmente

---

# Performance (PRIORIDADE ALTA)

O sistema precisa ser MUITO rápido.

Prioridades:
- poucas leituras do Firebase
- evitar re-render desnecessário
- otimizar realtime
- componentes leves
- carregamento instantâneo

---

# Objetivo do MVP

O objetivo NÃO é criar um sistema completo enterprise.

O objetivo é:
- simples
- bonito
- rápido
- funcional
- fácil de usar
- fácil de criar novas rifas

---

# Diferenciais Desejados

Se possível:
- gerar QR Code PIX
- copiar chave PIX
- botão WhatsApp para contato

---

# Deploy

Projeto deve ser facilmente deployável:
- Vercel
- Firebase

---

# Resultado Esperado

Quero um sistema:
- extremamente rápido
- minimalista
- bonito
- fácil de usar
- realtime
- estável
- simples de manter