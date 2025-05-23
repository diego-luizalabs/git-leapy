// Conteúdo SIMPLES para backend/src/server.ts

import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001; // O backend rodará na porta 3001

// Middleware para habilitar CORS (permitir requisições do seu frontend)
app.use(cors());

// Middleware para parsear JSON no corpo das requisições (útil para futuras rotas POST)
app.use(express.json());

// Uma rota de "health check" para testar se o servidor está respondendo
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'UP', message: 'Backend XuxuGlow (versão simples) está funcionando!' });
});

// Rota principal (apenas para um teste inicial)
app.get('/', (req: Request, res: Response) => {
    res.send('Bem-vindo ao Backend XuxuGlow (versão simples)!');
});

// Rota de configurações retornando dados fixos (como no início)
app.get('/api/configuracoes', (req: Request, res: Response) => {
    res.json({
        tema: 'escuro_roxo',
        notificacoesEmail: true,
        notificacoesApp: false,
        usuario: 'Diego'
    });
});

// Inicia o servidor e o faz ouvir na porta definida
app.listen(PORT, () => {
    console.log(`Backend XuxuGlow (versão simples) rodando na porta ${PORT}`);
    console.log(`Acesse a rota de health check em: http://localhost:${PORT}/api/health`);
    console.log(`Rota de configurações (dados fixos): http://localhost:${PORT}/api/configuracoes`);
});