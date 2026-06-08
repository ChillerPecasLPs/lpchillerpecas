import { defineCollection, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

const site = defineCollection({
  loader: file('src/content/site/config.json'),
  schema: z.object({
    whatsapp: z.string(),
    mensagemWhatsapp: z.string(),
    email: z.string().email(),
    emailSac: z.string().email().optional(),
    telefone: z.string(),
    telefoneWhatsapp: z.string().optional(),
    endereco: z.object({
      rua: z.string(),
      bairro: z.string().optional(),
      cidade: z.string(),
      estado: z.string(),
      cep: z.string(),
    }),
    horario: z.string(),
    empresa: z.object({
      nome: z.string(),
      razaoSocial: z.string().optional(),
      cnpj: z.string().optional(),
      tagline: z.string(),
      descricao: z.string(),
      desde: z.number(),
    }),
    estatisticas: z.array(z.object({
      numero: z.string(),
      rotulo: z.string(),
    })),
    tracking: z.object({
      gtmId: z.string().optional().default(''),
      ga4MeasurementId: z.string().optional().default(''),
      googleSiteVerification: z.string().optional().default(''),
      bingSiteVerification: z.string().optional().default(''),
      metaPixelId: z.string().optional().default(''),
    }).optional().default({}),
    redesSociais: z.object({
      instagram: z.string().optional().default(''),
      facebook: z.string().optional().default(''),
      linkedin: z.string().optional().default(''),
    }).optional().default({}),
    webhookLead: z.string().url().optional(),
    googleReviewsUrl: z.string().url().optional(),
  }),
});

const categorias = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/categorias' }),
  schema: z.object({
    nome: z.string(),
    icone: z.string(),
    ordem: z.number(),
    descricao: z.string(),
    destaque: z.boolean().default(false),
    imagem: z.string().optional(),
  }),
});

const marcas = defineCollection({
  loader: file('src/content/marcas/marcas.json'),
  schema: z.object({
    id: z.string(),
    nome: z.string(),
  }),
});

const depoimentos = defineCollection({
  loader: file('src/content/depoimentos/depoimentos.json'),
  schema: z.object({
    id: z.string(),
    nome: z.string(),
    empresa: z.string(),
    cargo: z.string().optional(),
    texto: z.string(),
  }),
});

const faq = defineCollection({
  loader: file('src/content/faq/faq.json'),
  schema: z.object({
    id: z.string(),
    pergunta: z.string(),
    resposta: z.string(),
    ordem: z.number(),
  }),
});

export const collections = { site, categorias, marcas, depoimentos, faq };
