const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const { getToken } = require("./functions/getTokenAcc");
const axios = require("axios");

const app = express();
const port = 3000;

const pool = new Pool({
  user: "postgres",
  host: "127.0.0.1",
  database: "test1",
  password: "123456",
  port: 5432,
  connectionTimeoutMillis: 2000,
});

app.use(cors());
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Ocurrió un error en el servidor" });
});

app.get("/api/contratos_interadministrativos", (req, res) => {
  const { is_active } = req.query;
  const query =
    is_active === "true"
      ? 'SELECT * FROM "contratosinteradministrativos" p WHERE p."ESTADO" = \'Activo\''
      : 'SELECT * FROM "contratosinteradministrativos"';
  pool
    .query(query)
    .then((result) => {
      res.json(result.rows);
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({ error: "Error al obtener los contratos interadministrativos" });
    });
});
app.get("/api/projectos_acc", (req, res) => {
  const accessToken = async () => {
    return await getToken();
  };
  const getHubId = async () => {
    const token = await accessToken();
    console.log(token);
    
    const url = `https://developer.api.autodesk.com/authentication/v2/token/project/v1/hubs`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    console.log(url, headers);
    
    try {
      const { data } = await axios.get(url, {
        headers,
      });
      if (data.data.length === 0) return null;
      console.log(data.data);
      
      return data.data[0].id;
    } catch (error) {
      console.error(error.status);
    }
  };

  const getProjectList = async () => {
    const hubId = await getHubId();
    const token = await accessToken();
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const url = `https://developer.api.autodesk.com/authentication/v2/token/project/v1/hubs/${hubId}/projects`;
    console.log(url);
    
    const { data } = await axios.get(url, {
      headers,
    });
    return data.data;
  };
  getProjectList()
    .then((resp) => {
      console.log(resp);

      res.json(resp);
    })
    .catch((err) => {
      console.error(err.status);
      res.status(500).json({ error: "Error al obtener projects" });
    });
});

app.get("/api/contratos_interadministrativos/:id", (req, res) => {
  const contratoId = decodeURIComponent(req.params.id);
  const query = `
    SELECT 
      p."CONTRATO_INTERADMINISTRATIVO" AS "contrato_interadministrativo",
      p."OBJETO" AS "objeto_contrato",
      d."CODIGO" AS "codigo_derivado",
      d."CLIENTE" AS "cliente",
      d."SUPERVISOR" AS "supervisor",
      d. "VALTOTAL" AS "valor_total",
      d. "PAGO_TOTAL" AS "pago_total"
    FROM "contratosinteradministrativos" p
    LEFT JOIN "contratoderivado" d
    ON d."CON_INTERADMINISTRATIVO" = p."CONTRATO_INTERADMINISTRATIVO"
    WHERE p."CONTRATO_INTERADMINISTRATIVO" = $1;
  `;

  pool
    .query(query, [contratoId])
    .then((result) => {
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Contrato interadministrativo no encontrado" });
      }
      res.json(result.rows);
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({ error: "Error al obtener el contrato interadministrativo" });
    });
});

// Consulta de contrato derivado por su identificador
app.get("/api/contratos_derivados/:id", (req, res) => {
  const contratoId = req.params.id;
  const query = `
    SELECT 
      d."CODIGO" AS "Código Contrato Derivado",
      d."CON_INTERADMINISTRATIVO" AS "Contrato Interadministrativo Referenciado",
      d."DESCRIPCION" AS "Descripción Contrato Derivado",
      d."VALOR_CONTRATO" AS "Valor Contrato Derivado"
    FROM "contratoDerivado" d
    WHERE d."CODIGO" = $1;
  `;

  pool
    .query(query, [contratoId])
    .then((result) => {
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Contrato derivado no encontrado" });
      }
      res.json(result.rows[0]); // Retorna solo el primer resultado como objeto
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Error al obtener el contrato derivado" });
    });
});
app.get(
  "/api/contratos_interadministrativos/:id/contratos_derivados",
  (req, res) => {
    const contratoId = decodeURIComponent(req.params.id);
    const query = `
    SELECT d.*
    FROM "contratoDerivado" d
    WHERE d."CON_INTERADMINISTRATIVO" = $1
  `;
    pool
      .query(query, [contratoId])
      .then((result) => res.json(result.rows))
      .catch((err) => {
        console.error(err);
        res
          .status(500)
          .json({ error: "Error al obtener los contratos derivados" });
      });
  }
);
app.get("/api/contratos_interadministrativos/:id/pmo", (req, res) => {
  const contratoId = decodeURIComponent(req.params.id);
  const query = `
    SELECT p.*
    FROM "pmo_ci" p
    WHERE p."CONTRATO_INTERADMINISTRATIVO" = $1
  `;
  pool
    .query(query, [contratoId])
    .then((result) => res.json(result.rows))
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({ error: "Error al obtener los contratos derivados" });
    });
});
app.get("/api/contratos_interadministrativos/:id/rubros", (req, res) => {
  const contratoId = decodeURIComponent(req.params.id);
  const query = `
    SELECT r.*
    FROM "interRubros" r
    WHERE r."CON_INTERADMINISTRATIVO" = $1
  `;
  pool
    .query(query, [contratoId])
    .then((result) => res.json(result.rows))
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Error al obtener los rubros" });
    });
});
app.get("/rubros/:contrato_interadministrativo", async (req, res) => {
  const contratoInteradministrativo = req.params.contrato_interadministrativo;

  const query = `
    SELECT 
        "RUBRO",
        "NOMBRE_RUBRO",
        "CONTRATO_INTERADMINISTRATIVO",
        ARRAY_AGG(DISTINCT "SRS_ANOP") AS "ANOS_UNICOS",
        SUM("APROPIACION_INICIAL") AS "TOTAL_APROPIACION_INICIAL",
        SUM("APROPIACION_DEFINITIVA") AS "TOTAL_APROPIACION_DEFINITIVA",
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'APROPIACION_INICIAL', "APROPIACION_INICIAL",
                'APROPIACION_DEFINITIVA', "APROPIACION_DEFINITIVA",
                'CDP', "CDP",
                'DISPONIBLE', "DISPONIBLE",
                'COMPROMETIDO', "COMPROMETIDO",
                'PAGOS', "PAGOS",
                'POR_COMPROMETER', "POR_COMPROMETER",
                'POR_PAGAR', "POR_PAGAR",
                'ANO', "SRS_ANOP"
            )
        ) AS "DETALLES"
    FROM interRubros2
    WHERE "CONTRATO_INTERADMINISTRATIVO" = $1
    GROUP BY "RUBRO", "NOMBRE_RUBRO", "CONTRATO_INTERADMINISTRATIVO";
  `;

  try {
    const { rows } = await pool.query(query, [contratoInteradministrativo]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: "No se encontraron rubros para el contrato proporcionado.",
      });
    }

    res.json(rows);
  } catch (error) {
    console.error("Error al ejecutar la consulta:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.get(
  "/api/contratos_interadministrativos/:id/detalles",
  async (req, res) => {
    const contratoId = decodeURIComponent(req.params.id);

    const queryInteradministrativo = `
    SELECT 
      p."CONTRATO_INTERADMINISTRATIVO" AS "contrato_interadministrativo",
      p."NOMBRE_INTERADMINISTRATIVO" AS "nombre_interadministrativo",
      p."CLIENTE" AS "cliente",
      p."CENTRO_DE_COSTOS" AS "centro_de_costos",
      p."VALOR_HONORARIOS" AS "valor_honorarios",
      p."VALOR" AS "valor",
      p."PORCENTAJE_HONORARIOS" AS "porcentaje_honorarios",
      p."PLAZO" AS "plazo",
      p."OBJETO" AS "objeto_contrato"
    FROM "contratosinteradministrativos" p
    WHERE p."CONTRATO_INTERADMINISTRATIVO" = $1;
  `;

    const queryContratosDerivados = `
    SELECT 
      d."CODIGO" AS "codigo_derivado",
      d."CLIENTE" AS "cliente",
      d."SUPERVISOR" AS "supervisor",
      d."VALTOTAL" AS "valor_total",
      d."PAGO_TOTAL" AS "pago_total"
    FROM "contratosinteradministrativos" p
    LEFT JOIN "contratoderivado" d
    ON d."CON_INTERADMINISTRATIVO" = p."CONTRATO_INTERADMINISTRATIVO"
    WHERE p."CONTRATO_INTERADMINISTRATIVO" = $1;
  `;

    const queryRubros = `
    SELECT 
    "RUBRO" AS "rubro",
    "RUBRO_ID" AS "rubroId",
    "NOMBRE_RUBRO" AS "nombre_rubro",
    "CONTRATO_INTERADMINISTRATIVO" AS "contrato_interadministrativo",
    ARRAY_AGG(DISTINCT "SRS_ANOP") AS "anos_unicos",
    SUM("APROPIACION_INICIAL") AS "total_apropiacion_inicial",
    SUM("APROPIACION_DEFINITIVA") AS "total_apropiacion_definitiva",
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'apropiacion_inicial', "APROPIACION_INICIAL",
            'apropiacion_definitiva', "APROPIACION_DEFINITIVA",
            'cdp', "CDP",
            'disponible', "DISPONIBLE",
            'comprometido', "COMPROMETIDO",
            'pagos', "PAGOS",
            'por_comprometer', "POR_COMPROMETER",
            'por_pagar', "POR_PAGAR",
            'ano', "SRS_ANOP"
        )
    ) AS "detalles"
    FROM interRubros2
    WHERE "CONTRATO_INTERADMINISTRATIVO" = $1
    GROUP BY "RUBRO", "NOMBRE_RUBRO", "CONTRATO_INTERADMINISTRATIVO", "RUBRO_ID";
  `;

    try {
      // Ejecutar las consultas en paralelo
      const [interResult, derivadosResult, rubrosResult] = await Promise.all([
        pool.query(queryInteradministrativo, [contratoId]),
        pool.query(queryContratosDerivados, [contratoId]),
        pool.query(queryRubros, [contratoId]),
      ]);

      // Estructurar la respuesta
      const contratoDetalles = interResult.rows[0] || null;
      const contratosDerivados = derivadosResult.rows || [];
      const rubros = rubrosResult.rows || [];

      res.json({
        contrato_detalles: contratoDetalles,
        con_derivados: contratosDerivados,
        rubros: rubros,
      });
    } catch (error) {
      console.error("Error al ejecutar las consultas:", error);
      res.status(500).json({ message: "Error interno del servidor." });
    }
  }
);

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
