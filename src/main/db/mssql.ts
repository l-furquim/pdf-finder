import sql, { ConnectionPool } from 'mssql'
import type { EmployeeData, DatabaseQueryResult } from '../../types'
import { extractDigits } from '../../utils/cpf'

let pool: ConnectionPool | undefined

export async function initMssqlPool(): Promise<ConnectionPool> {
  if (!pool) {
    const server = process.env.DB_SERVER
    const database = process.env.DB_DATABASE
    const user = process.env.DB_USER
    const password = process.env.DB_PASSWORD
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433
    const trustServerCertificate = process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'

    console.log('[MSSQL] Verificando configurações:')
    console.log(`  - DB_SERVER: ${server ? '✓ Definido' : '✗ Não definido'}`)
    console.log(`  - DB_DATABASE: ${database ? '✓ Definido' : '✗ Não definido'}`)
    console.log(`  - DB_USER: ${user ? '✓ Definido' : '✗ Não definido'}`)
    console.log(`  - DB_PASSWORD: ${password ? '✓ Definido' : '✗ Não definido'}`)
    console.log(`  - DB_PORT: ${port}`)

    if (!server || !database || !user || !password) {
      throw new Error(
        'Configuração MSSQL incompleta. Verifique DB_SERVER, DB_DATABASE, DB_USER e DB_PASSWORD no arquivo .env'
      )
    }

    try {
      const config: sql.config = {
        server,
        port,
        database,
        user,
        password,
        options: {
          encrypt: true,
          trustServerCertificate,
          enableArithAbort: true,
          connectTimeout: 30000,
          requestTimeout: 30000
        },
        pool: {
          min: 2,
          max: 10,
          idleTimeoutMillis: 30000
        }
      }

      pool = await new sql.ConnectionPool(config).connect()
      console.log('[MSSQL] Pool de conexões criado com sucesso')
    } catch (error: any) {
      console.error('[MSSQL] Erro ao criar pool:', error)
      throw new Error(`Falha ao conectar ao MSSQL: ${error.message || error}`)
    }
  }

  return pool
}

export async function executeQuery<T = any>(
  query: string,
  params?: Record<string, any>
): Promise<T[]> {
  const mssqlPool = await initMssqlPool()

  try {
    const request = mssqlPool.request()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value)
      })
    }

    const result = await request.query(query)
    return result.recordset as T[]
  } catch (error) {
    console.error('[MSSQL] Erro ao executar query:', error)
    throw error
  }
}

export async function queryNotFoundCpfs(cpfs: string[]): Promise<DatabaseQueryResult> {
  if (cpfs.length === 0) {
    return {
      success: true,
      data: {},
      errors: []
    }
  }

  const errors: string[] = []
  const data: Record<string, EmployeeData> = {}

  try {
    const cpfDigitsOnly = cpfs.map(cpf => extractDigits(cpf))
    const uniqueCpfs = Array.from(new Set(cpfDigitsOnly))

    console.log(`[MSSQL] Buscando dados para ${uniqueCpfs.length} CPFs não encontrados...`)

    const mssqlPool = await initMssqlPool()
    const request = mssqlPool.request()

    const cpfTuples = uniqueCpfs.map(cpf => `('${cpf}')`).join(',\n        ')

    const query = `
      WITH PESSOAS_FILTRADAS AS (
        SELECT 
          INF.CPF, 
          INF.MATRICULA, 
          INF.NOME_PROFISSIONAL,
          ROW_NUMBER() OVER (
            PARTITION BY INF.CPF
            ORDER BY INF.DATA_ULTIMA_ATUALIZACAO DESC
          ) AS RN
        FROM DW.SCH_HR.TBL_NATCORP_DIM_PROFISSIONAIS INF
        WHERE INF.CPF IN (
          ${cpfTuples}
        )
      )
      SELECT 
        P.CPF,
        P.MATRICULA, 
        P.NOME_PROFISSIONAL AS NOME
      FROM PESSOAS_FILTRADAS P
      WHERE P.RN = 1
    `

    console.log('[MSSQL] Executando query:', query)

    const result = await request.query(query)
    const rows = result.recordset

    console.log(`[MSSQL] Encontrados ${rows.length} registros`)

    for (const row of rows) {
      const cpf = String(row.CPF).padStart(11, '0')
      
      data[cpf] = {
        MATRICULA: row.MATRICULA || 'N/A',
        NOME: row.NOME || 'N/A'
      }
    }

    return {
      success: true,
      data,
      errors: []
    }
  } catch (error: any) {
    const errorMsg = `Erro na query MSSQL: ${error.message || error}`
    console.error('[MSSQL]', errorMsg)
    errors.push(errorMsg)
    
    return {
      success: false,
      data: {},
      errors
    }
  }
}

export async function closeMssqlPool(): Promise<void> {
  if (pool) {
    try {
      await pool.close()
      pool = undefined
      console.log('[MSSQL] Pool de conexões fechado')
    } catch (error) {
      console.error('[MSSQL] Erro ao fechar pool:', error)
    }
  }
}

export async function testMssqlConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await initMssqlPool()
    const result = await executeQuery<{ TEST: number }>('SELECT 1 AS TEST')
    
    if (result.length > 0 && result[0].TEST === 1) {
      return {
        success: true,
        message: 'Conexão com MSSQL estabelecida com sucesso'
      }
    }
    
    return {
      success: false,
      message: 'Conexão estabelecida mas query de teste falhou'
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Falha na conexão: ${error.message || error}`
    }
  }
}
