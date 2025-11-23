# 🎨 Ícone da Aplicação

## Sobre o Ícone

Para que a aplicação desktop tenha um ícone personalizado, você precisa criar ou obter um arquivo de ícone no formato `.ico` (Windows) e `.png` (geral).

## Como Criar o Ícone

### Opção 1: Usar um Gerador Online

1. Acesse um dos sites:
   - https://convertio.co/png-ico/
   - https://www.favicon-generator.org/
   - https://www.icoconverter.com/

2. Faça upload de uma imagem (preferencialmente PNG de 512x512 pixels)

3. Gere o arquivo `.ico` com múltiplas resoluções:
   - 16x16
   - 32x32
   - 48x48
   - 256x256

4. Baixe e salve como `electron/icon.ico`

### Opção 2: Usar Ferramentas Desktop

**Windows:**
- IcoFX (https://icofx.ro/)
- GIMP com plugin ICO

**Online:**
- Figma ou Canva para design
- Export para PNG 512x512
- Converter para ICO

## Recomendações de Design

- **Tema**: Bicicleta, estacionamento, ou letra "B"
- **Cores**: Azul (#3B82F6) conforme o tema do sistema
- **Estilo**: Simples e reconhecível em tamanhos pequenos
- **Fundo**: Transparente ou cor sólida

## Arquivos Necessários

Coloque os arquivos nesta pasta (`electron/`):

```
electron/
  ├── icon.ico      # Para Windows (obrigatório)
  └── icon.png      # Para outros sistemas (opcional)
```

## Ícone Padrão

Se você não fornecer um ícone personalizado, o Electron usará o ícone padrão dele (um átomo azul).

## Exemplo de Ícone Simples

Você pode criar um ícone simples com:
- Fundo azul circular
- Ícone de bicicleta branco no centro
- Bordas arredondadas

Ferramentas gratuitas:
- Canva: https://www.canva.com/
- Figma: https://www.figma.com/
