# AcadEventos API

Este projeto corresponde ao back-end da aplicação AcadEventos, desenvolvido com Node.js, Express e MongoDB.

## Development server

Para iniciar o servidor local de desenvolvimento, execute:

    npm start

Após iniciar o servidor, acesse no navegador:

    http://localhost:3000

A API será executada localmente na porta 3000.

## Instalação das dependências

Antes de executar o projeto, instale as dependências com:

    npm install

## Configuração do ambiente

Para o back-end funcionar corretamente, é necessário criar um arquivo `.env` na raiz da pasta `api-acadeventos`.

Exemplo:

    PORT=3000
    MONGODB_URI=sua_uri_do_mongodb

A variável `MONGODB_URI` deve conter a string de conexão com o banco de dados MongoDB.

## Banco de dados

O banco de dados utilizado é o MongoDB.

As principais coleções utilizadas são:

    usuarios
    eventos

## Rotas principais

Para listar eventos:

    GET /eventos

Para buscar um evento específico:

    GET /eventos/:id

Para criar um evento:

    POST /eventos

Para editar um evento:

    PUT /eventos/:id

Para excluir um evento:

    DELETE /eventos/:id

Para cadastrar usuário:

    POST /usuarios

Para realizar login demonstrativo:

    POST /usuarios/login

Para realizar inscrição em evento:

    POST /eventos/:id/inscrever

Para cancelar inscrição em evento:

    POST /eventos/:id/cancelar-inscricao

Para listar as inscrições de um participante:

    GET /inscricoes/:participante

Para visualizar inscritos de um evento:

    GET /eventos/:id/inscritos

## Funcionalidades

Cadastro demonstrativo de usuários.

Login demonstrativo.

Listagem de eventos.

Busca de eventos por texto.

Filtro de eventos por categoria.

Ordenação de eventos por data.

Criação de eventos pelo organizador.

Edição de eventos pelo organizador.

Exclusão de eventos pelo organizador.

Inscrição de participantes em eventos.

Cancelamento de inscrição.

Listagem das inscrições do participante.

Visualização dos inscritos por evento.

## Tecnologias utilizadas

    Node.js
    Express
    MongoDB
    Mongoose
    CORS
    dotenv
    morgan

## Observação

Este back-end faz parte da aplicação AcadEventos e deve ser executado junto com o front-end Angular disponível na pasta `front-acadeventos`.
