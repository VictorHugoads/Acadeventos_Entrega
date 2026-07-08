import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';

const app = express();

app.use(express.json());

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));

// Modelo Evento
const eventoSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
      minlength: 3
    },
    descricao: {
      type: String,
      required: true,
      trim: true
    },
    dataHora: {
      type: Date,
      required: true
    },
    local: {
      type: String,
      required: true,
      trim: true
    },
    categoria: {
      type: String,
      required: true,
      trim: true
    },
    vagas: {
      type: Number,
      required: true,
      min: 1
    },
    imagem: {
      type: String,
      default: ''
    },
    organizador: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    inscritos: {
      type: [String],
      default: []
    }
  },
  {
    collection: 'eventos',
    timestamps: true
  }
);

// Modelo Usuario
const usuarioSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    isOrganizer: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    collection: 'usuarios',
    timestamps: true
  }
);

const Evento = mongoose.model('Evento', eventoSchema, 'eventos');
const Usuario = mongoose.model('Usuario', usuarioSchema, 'usuarios');

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim().toLowerCase() : '';
}

function escaparRegex(valor) {
  return String(valor).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function criarFiltroOrganizador(organizador) {
  const organizadorNormalizado = normalizarTexto(organizador);

  if (!organizadorNormalizado) {
    return null;
  }

  return {
    $regex: `^${escaparRegex(organizadorNormalizado)}$`,
    $options: 'i'
  };
}

function extrairDadosUsuario(dados = {}) {
  const isOrganizer = dados.isOrganizer === true || dados.isOrganizer === 'true';

  return {
    username: normalizarTexto(dados.username),
    isOrganizer
  };
}

async function criarUsuarioNoBanco(dados) {
  const usuario = await Usuario.create(extrairDadosUsuario(dados));

  return usuario.toObject();
}

async function verificarUsuarioPorUsername(username) {
  const usernameNormalizado = normalizarTexto(username);

  if (!usernameNormalizado) {
    return null;
  }

  return Usuario.findOne({ username: usernameNormalizado });
}

async function verificarOrganizadorExistente(username) {
  const usuario = await verificarUsuarioPorUsername(username);

  if (!usuario || !usuario.isOrganizer) {
    return null;
  }

  return usuario;
}

function extrairDadosEvento(dados = {}, permitirAlterarOrganizador = true) {
  const camposPermitidos = [
    'titulo',
    'descricao',
    'dataHora',
    'local',
    'categoria',
    'vagas',
    'imagem'
  ];

  if (permitirAlterarOrganizador) {
    camposPermitidos.push('organizador');
  }

  return camposPermitidos.reduce((acumulado, campo) => {
    if (dados[campo] !== undefined) {
      if (campo === 'organizador') {
        acumulado[campo] = normalizarTexto(dados[campo]);
      } else {
        acumulado[campo] = dados[campo];
      }
    }

    return acumulado;
  }, {});
}

function calcularStatus(dataHora) {
  const agora = new Date();
  const dataEvento = new Date(dataHora);

  if (dataEvento > agora) {
    return 'futuro';
  }

  const umaHoraDepois = new Date(dataEvento.getTime() + 60 * 60 * 1000);

  if (agora >= dataEvento && agora <= umaHoraDepois) {
    return 'ocorrendo';
  }

  return 'finalizado';
}

function formatarEvento(evento) {
  const obj = evento.toObject();

  return {
    ...obj,
    status: calcularStatus(obj.dataHora),
    vagasDisponiveis: Math.max(obj.vagas - obj.inscritos.length, 0),
    totalInscritos: obj.inscritos.length
  };
}

function validarIdEvento(id) {
  return mongoose.isValidObjectId(id);
}

function usuarioEhDonoDoEvento(evento, organizadorInformado) {
  const donoDoEvento = normalizarTexto(evento.organizador);
  const organizadorNormalizado = normalizarTexto(organizadorInformado);

  return donoDoEvento && organizadorNormalizado && donoDoEvento === organizadorNormalizado;
}

// Rota inicial
app.get('/', (req, res) => {
  res.json({
    msg: 'API AcadEventos rodando'
  });
});

// Criar usuário
app.post('/usuarios', async (req, res) => {
  try {
    const usuario = await criarUsuarioNoBanco(req.body);

    res.status(201).json(usuario);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: 'Já existe um usuário com esse username.'
      });
    }

    res.status(400).json({
      error: err.message
    });
  }
});

// Login simples por username
app.post('/usuarios/login', async (req, res) => {
  try {
    const { username } = req.body;
    const usuario = await verificarUsuarioPorUsername(username);

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuário não encontrado.'
      });
    }

    res.json({
      ok: true,
      usuario: {
        id: usuario._id,
        username: usuario.username,
        isOrganizer: usuario.isOrganizer
      }
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Verificar se existe usuário com username
app.get('/usuarios/:username', async (req, res) => {
  try {
    const usuario = await verificarUsuarioPorUsername(req.params.username);

    if (!usuario) {
      return res.status(404).json({
        exists: false
      });
    }

    res.json({
      exists: true,
      usuario: {
        id: usuario._id,
        username: usuario.username,
        isOrganizer: usuario.isOrganizer
      }
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Listar eventos com filtros
app.get('/eventos', async (req, res) => {
  try {
    const { texto, categoria, ordenar, organizador } = req.query;

    const filtro = {};

    if (texto) {
      filtro.$or = [
        { titulo: { $regex: texto, $options: 'i' } },
        { descricao: { $regex: texto, $options: 'i' } },
        { local: { $regex: texto, $options: 'i' } },
        { categoria: { $regex: texto, $options: 'i' } }
      ];
    }

    if (categoria) {
      filtro.categoria = categoria;
    }

    if (organizador) {
      const filtroOrganizador = criarFiltroOrganizador(organizador);

      if (filtroOrganizador) {
        filtro.organizador = filtroOrganizador;
      }
    }

    let ordenacao = { dataHora: 1 };

    if (ordenar === 'desc' || ordenar === 'data-desc') {
      ordenacao = { dataHora: -1 };
    }

    if (ordenar === 'asc' || ordenar === 'data-asc') {
      ordenacao = { dataHora: 1 };
    }

    const eventos = await Evento.find(filtro).sort(ordenacao);

    res.json(eventos.map(formatarEvento));
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Listar categorias reais dos eventos
app.get('/eventos/categorias', async (req, res) => {
  try {
    const { organizador } = req.query;

    const filtro = {};

    if (organizador) {
      const filtroOrganizador = criarFiltroOrganizador(organizador);

      if (filtroOrganizador) {
        filtro.organizador = filtroOrganizador;
      }
    }

    const categorias = await Evento.distinct('categoria', filtro);

    const categoriasFormatadas = categorias
      .filter(Boolean)
      .map(categoria => String(categoria).trim())
      .filter(categoria => categoria.length > 0)
      .sort((a, b) => a.localeCompare(b));

    res.json(categoriasFormatadas);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Buscar evento pelo ID
app.get('/eventos/:id', async (req, res) => {
  try {
    if (!validarIdEvento(req.params.id)) {
      return res.status(400).json({
        error: 'ID inválido'
      });
    }

    const evento = await Evento.findById(req.params.id);

    if (!evento) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    res.json(formatarEvento(evento));
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Criar evento
app.post('/eventos', async (req, res) => {
  try {
    const dadosEvento = extrairDadosEvento(req.body, true);
    const organizador = await verificarOrganizadorExistente(dadosEvento.organizador);

    if (!organizador) {
      return res.status(400).json({
        error: 'O organizador informado precisa existir e ter perfil de organizador.'
      });
    }

    const evento = await Evento.create(dadosEvento);

    res.status(201).json(formatarEvento(evento));
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
});

// Editar evento
app.put('/eventos/:id', async (req, res) => {
  try {
    if (!validarIdEvento(req.params.id)) {
      return res.status(400).json({
        error: 'ID inválido'
      });
    }

    const eventoAtual = await Evento.findById(req.params.id);

    if (!eventoAtual) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    const organizadorInformado = req.body.organizador;

    if (!organizadorInformado) {
      return res.status(400).json({
        error: 'Informe o organizador responsável pela edição.'
      });
    }

    const organizador = await verificarOrganizadorExistente(organizadorInformado);

    if (!organizador) {
      return res.status(400).json({
        error: 'O organizador informado precisa existir e ter perfil de organizador.'
      });
    }

    if (!usuarioEhDonoDoEvento(eventoAtual, organizadorInformado)) {
      return res.status(403).json({
        error: 'Você só pode editar eventos criados por você.'
      });
    }

    if (new Date(eventoAtual.dataHora) < new Date()) {
      return res.status(400).json({
        error: 'Não é permitido editar evento que já ocorreu ou já iniciou.'
      });
    }

    if (req.body.dataHora && new Date(req.body.dataHora) < new Date()) {
      return res.status(400).json({
        error: 'Não é permitido alterar o evento para uma data passada.'
      });
    }

    const dadosAtualizados = extrairDadosEvento(req.body, false);

    const evento = await Evento.findByIdAndUpdate(
      req.params.id,
      dadosAtualizados,
      {
        new: true,
        runValidators: true
      }
    );

    res.json(formatarEvento(evento));
  } catch (err) {
    res.status(400).json({
      error: err.message
    });
  }
});

// Excluir evento
app.delete('/eventos/:id', async (req, res) => {
  try {
    if (!validarIdEvento(req.params.id)) {
      return res.status(400).json({
        error: 'ID inválido'
      });
    }

    const evento = await Evento.findById(req.params.id);

    if (!evento) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    const organizadorInformado = req.query.organizador || req.body.organizador;

    if (!organizadorInformado) {
      return res.status(400).json({
        error: 'Informe o organizador responsável pela exclusão.'
      });
    }

    const organizador = await verificarOrganizadorExistente(organizadorInformado);

    if (!organizador) {
      return res.status(400).json({
        error: 'O organizador informado precisa existir e ter perfil de organizador.'
      });
    }

    if (!usuarioEhDonoDoEvento(evento, organizadorInformado)) {
      return res.status(403).json({
        error: 'Você só pode excluir eventos criados por você.'
      });
    }

    if (new Date(evento.dataHora) < new Date()) {
      return res.status(400).json({
        error: 'Não é permitido excluir evento que já ocorreu ou já iniciou.'
      });
    }

    await Evento.findByIdAndDelete(req.params.id);

    res.json({
      ok: true,
      msg: 'Evento excluído com sucesso'
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Inscrever participante em evento
app.post('/eventos/:id/inscrever', async (req, res) => {
  try {
    const { participante } = req.body;
    const usuarioParticipante = await verificarUsuarioPorUsername(participante);

    if (!participante) {
      return res.status(400).json({
        error: 'Informe o nome ou email do participante.'
      });
    }

    if (!usuarioParticipante) {
      return res.status(404).json({
        error: 'O participante informado precisa existir no sistema.'
      });
    }

    if (!validarIdEvento(req.params.id)) {
      return res.status(400).json({
        error: 'ID inválido'
      });
    }

    const evento = await Evento.findById(req.params.id);

    if (!evento) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    if (new Date(evento.dataHora) < new Date()) {
      return res.status(400).json({
        error: 'Não é possível se inscrever em evento que já ocorreu.'
      });
    }

    const agora = new Date();

    const eventoAtualizado = await Evento.findOneAndUpdate(
      {
        _id: req.params.id,
        dataHora: { $gte: agora },
        inscritos: { $ne: usuarioParticipante.username },
        $expr: { $lt: [{ $size: '$inscritos' }, '$vagas'] }
      },
      {
        $addToSet: { inscritos: usuarioParticipante.username }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!eventoAtualizado) {
      if (evento.inscritos.includes(usuarioParticipante.username)) {
        return res.status(400).json({
          error: 'Participante já inscrito neste evento.'
        });
      }

      if (evento.inscritos.length >= evento.vagas) {
        return res.status(400).json({
          error: 'Evento sem vagas disponíveis.'
        });
      }

      return res.status(400).json({
        error: 'Não é possível se inscrever em evento que já ocorreu.'
      });
    }

    res.json(formatarEvento(eventoAtualizado));
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Cancelar inscrição
app.post('/eventos/:id/cancelar-inscricao', async (req, res) => {
  try {
    const { participante } = req.body;
    const usuarioParticipante = await verificarUsuarioPorUsername(participante);

    if (!participante) {
      return res.status(400).json({
        error: 'Informe o nome ou email do participante.'
      });
    }

    if (!usuarioParticipante) {
      return res.status(404).json({
        error: 'O participante informado precisa existir no sistema.'
      });
    }

    if (!validarIdEvento(req.params.id)) {
      return res.status(400).json({
        error: 'ID inválido'
      });
    }

    const evento = await Evento.findById(req.params.id);

    if (!evento) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    if (!evento.inscritos.includes(usuarioParticipante.username)) {
      return res.status(400).json({
        error: 'Participante não está inscrito neste evento.'
      });
    }

    evento.inscritos = evento.inscritos.filter(
      inscrito => inscrito !== usuarioParticipante.username
    );

    await evento.save();

    res.json(formatarEvento(evento));
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Ver minhas inscrições
app.get('/inscricoes/:participante', async (req, res) => {
  try {
    const usuarioParticipante = await verificarUsuarioPorUsername(req.params.participante);

    if (!usuarioParticipante) {
      return res.status(404).json({
        error: 'O participante informado precisa existir no sistema.'
      });
    }

    const eventos = await Evento.find({
      inscritos: usuarioParticipante.username
    }).sort({ dataHora: 1 });

    res.json(eventos.map(formatarEvento));
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Ver inscritos por evento
app.get('/eventos/:id/inscritos', async (req, res) => {
  try {
    if (!validarIdEvento(req.params.id)) {
      return res.status(400).json({
        error: 'ID inválido'
      });
    }

    const evento = await Evento.findById(req.params.id);

    if (!evento) {
      return res.status(404).json({
        error: 'Evento não encontrado'
      });
    }

    const organizadorInformado = req.query.organizador;

    if (!organizadorInformado) {
      return res.status(400).json({
        error: 'Informe o organizador responsável pela consulta.'
      });
    }

    const organizador = await verificarOrganizadorExistente(organizadorInformado);

    if (!organizador) {
      return res.status(400).json({
        error: 'O organizador informado precisa existir e ter perfil de organizador.'
      });
    }

    if (!usuarioEhDonoDoEvento(evento, organizadorInformado)) {
      return res.status(403).json({
        error: 'Você só pode visualizar inscritos de eventos criados por você.'
      });
    }

    res.json({
      evento: evento.titulo,
      totalInscritos: evento.inscritos.length,
      inscritos: evento.inscritos
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Debug do banco
app.get('/debug', async (req, res) => {
  try {
    if (!mongoose.connection.db) {
      return res.status(500).json({
        error: 'Banco ainda não conectado'
      });
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    const totalEventos = await Evento.countDocuments();

    res.json({
      bancoConectado: mongoose.connection.name,
      collectionUsada: Evento.collection.name,
      totalEventos,
      collections: collections.map(c => c.name)
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// Iniciar servidor
async function iniciarServidor() {
  try {
    console.log('Tentando conectar ao MongoDB...');
    console.log('PORT:', process.env.PORT || 3000);
    console.log('URI existe?', !!process.env.MONGODB_URI);

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI não encontrada no arquivo .env');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'acadeventos',
      serverSelectionTimeoutMS: 10000,
      family: 4
    });

    console.log('Conectado ao MongoDB');
    console.log('Banco conectado:', mongoose.connection.name);
    console.log('Collection usada:', Evento.collection.name);

    app.listen(process.env.PORT || 3000, () => {
      console.log(`Servidor rodando em http://localhost:${process.env.PORT || 3000}`);
    });
  } catch (err) {
    console.log('Erro ao conectar no MongoDB:');
    console.log(err.message);
  }
}

iniciarServidor();