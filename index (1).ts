import type { FastifyInstance } from 'fastify'
import { authRoutes }             from './auth'
import { tmaAuthRoute }           from './tma-auth'
import { userRoutes }             from './users'
import { tariffRoutes }           from './tariffs'
import { paymentRoutes }          from './payments'
import { webhookRoutes }          from './webhooks'
import { adminRoutes }            from './admin'
import { adminV2Routes }          from './admin-v2'
import { adminImportRoutes }      from './admin-import'
import { publicRoutes }           from './public'
import { publicV2Routes }         from './public-v2'
import { userV2Routes }           from './user-v2'
import { instructionRoutes, adminInstructionRoutes } from './instructions'

export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    status:    'ok',
    version:   process.env.npm_package_version ?? '1.0.0',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()),
  }))

  await app.register(publicRoutes,             { prefix: '/api/public'              })
  await app.register(publicV2Routes,           { prefix: '/api/public'              })
  await app.register(authRoutes,               { prefix: '/api/auth'                })
  await app.register(tmaAuthRoute,             { prefix: '/api/auth'                })
  await app.register(userRoutes,               { prefix: '/api/user'                })
  await app.register(userV2Routes,             { prefix: '/api/user'                })
  await app.register(tariffRoutes,             { prefix: '/api/tariffs'             })
  await app.register(paymentRoutes,            { prefix: '/api/payments'            })
  await app.register(webhookRoutes,            { prefix: '/api/webhooks'            })
  await app.register(adminRoutes,              { prefix: '/api'                     })
  await app.register(adminV2Routes,            { prefix: '/api'                     })
  await app.register(adminImportRoutes,        { prefix: '/api/admin/import'        })
  await app.register(instructionRoutes,        { prefix: '/api/instructions'        })
  await app.register(adminInstructionRoutes,   { prefix: '/api/admin/instructions'  })
}
