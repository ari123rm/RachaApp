// src/components/Home.tsx
import { useState, useEffect } from 'react';
import { ArrowUpRight, LoaderCircle, TrendingUp } from 'lucide-react';
import { dbService } from '../services/database';
import type { Amigo } from '../types';
import { FriendDetailsModal } from './FriendDetailsModal'; // 🟢 1. IMPORT DO MODAL
import moneyConverter from '../utils/moneyConverter';

interface AmigoDevedor extends Amigo {
  divida: number;
}

export function Home() {
  const [totalGasto, setTotalGasto] = useState(0);
  const [totalAReceber, setTotalAReceber] = useState(0);
  const [amigosDevedores, setAmigosDevedores] = useState<AmigoDevedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [amigoSelecionado, setAmigoSelecionado] = useState<any>(null);
  const [nomeUsuario, setNomeUsuario] = useState('Ariel');
  // 🟢 1. PEGAR O MÊS ATUAL DINAMICAMENTE 🟢
  const dataAtual = new Date();
  const nomeMesBruto = dataAtual.toLocaleString('pt-BR', { month: 'long' });
  // Deixa a primeira letra maiúscula (ex: "abril" -> "Abril")
  const nomeMesAtual = nomeMesBruto.charAt(0).toUpperCase() + nomeMesBruto.slice(1);

  const carregarDashboard = async () => {
    setIsLoading(true);
    try {
      const [corridas, todosAmigos] = await Promise.all([
        dbService.corridas.getAll(),
        dbService.amigos.getAll()
      ]);

      // 🟢 2. FILTRAR CORRIDAS APENAS DO MÊS ATUAL PARA O GASTO 🟢
      const mesAtualNum = dataAtual.getMonth() + 1;
      const anoAtualNum = dataAtual.getFullYear();

      const corridasDesteMes = corridas.filter(c => {
        const [ano, mes] = c.data.split('-');
        return Number(mes) === mesAtualNum && Number(ano) === anoAtualNum;
      });

      const configuracoes = await dbService.settings.get();
      setNomeUsuario(configuracoes.nome);

      // Soma apenas as corridas que passaram no filtro do mês
      const somaGasto = corridasDesteMes.reduce((acc, curr) => acc + curr.valorTotal, 0);
      setTotalGasto(somaGasto);

      // 3. Calcular quem te deve (Dívidas são gerais, não filtramos por mês)
      const devedores = await Promise.all(
        todosAmigos.map(async (amigo) => {
          const divida = await dbService.financeiro.calcularDividaDoAmigo(amigo.id);
          return { ...amigo, divida };
        })
      );

      const apenasDevedores = devedores.filter(a => a.divida > 0);
      setAmigosDevedores(apenasDevedores);

      const somaReceber = apenasDevedores.reduce((acc, curr) => acc + curr.divida, 0);
      setTotalAReceber(somaReceber);

    } catch (error) {
      console.error("Erro ao carregar Dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#2DD4BF]">
        <LoaderCircle size={40} className="animate-spin mb-4" />
        <p className="text-gray-400">Calculando finanças...</p>
      </div>
    );
  }

  const handleExcluirAmigo = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este amigo?")) return;
    try {
      await dbService.amigos.delete(id);
      setAmigoSelecionado(null);
      carregarDashboard(); // Recarrega os dados da Home na hora
    } catch (error) {
      alert("Erro ao excluir o amigo.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <header className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-xl font-bold">Olá, {nomeUsuario.split(' ')[0]}</h1>
          {/* 🟢 4. NOME DO MÊS DINÂMICO AQUI 🟢 */}
          <p className="text-xs text-gray-500">Seu resumo de {nomeMesAtual}</p>
        </div>
        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
            <span className="text-sm font-medium uppercase">{nomeUsuario[0]}</span>
        </div>
      </header>

      {/* Card Principal: Total Gasto */}
      <div className="bg-gradient-to-br from-[#1A2b4c] via-[#241b3d] to-[#3B1F42] rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="relative z-10">
          {/* 🟢 E AQUI TAMBÉM 🟢 */}
          <p className="text-gray-300 text-sm mb-1">Total Pago ({nomeMesAtual}):</p>
          <div className="flex items-end gap-2 mb-4">
            <h2 className="text-4xl font-black tracking-tight">
              R$ {moneyConverter(totalGasto)}
            </h2>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 border border-white/10">
            <div className="w-8 h-8 bg-[#2DD4BF] rounded-full flex items-center justify-center text-[#05080f]">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">A receber (Total)</p>
              <p className="text-white font-bold">R$ {moneyConverter(totalAReceber)}</p>
            </div>
          </div>
        </div>
        
        <div className="absolute top-6 right-6">
          <ArrowUpRight className="text-[#8b5cf6]" size={24} />
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full"></div>
      </div>

      {/* Seção Amigos que te devem */}
      <div>
        <h3 className="text-lg font-bold mb-4 text-gray-200">Amigos que te devem</h3>
        
        {amigosDevedores.length === 0 ? (
          <div className="bg-[#1c1c1e] p-6 rounded-3xl border border-white/5 text-center">
            <p className="text-gray-500 text-sm italic">Nenhuma dívida pendente. 🎉</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {amigosDevedores.map((amigo) => (
              <div 
                key={amigo.id} 
                onClick={() => setAmigoSelecionado({
                  ...amigo, 
                  divida: moneyConverter(amigo.divida)
                })}
                className="flex flex-col items-center gap-2 min-w-[85px] cursor-pointer active:scale-95 transition-transform"
              >
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full ${amigo.cor} flex items-center justify-center shadow-lg border-2 border-[#05080f]`}>
                    <span className="text-2xl font-black text-white">{amigo.nome[0]}</span>
                  </div>
                  {/* Badge de alerta de dívida */}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[#05080f] flex items-center justify-center">
                    <span className="text-[8px] font-bold">!</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-white truncate w-20">{amigo.nome.split(' ')[0]}</p>
                  <p className="text-[10px] font-bold text-red-400">R$ {moneyConverter(amigo.divida)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <FriendDetailsModal 
        amigo={amigoSelecionado}
        isOpen={!!amigoSelecionado}
        onClose={() => setAmigoSelecionado(null)}
        onDelete={handleExcluirAmigo}
      />
    </div>
  );
}