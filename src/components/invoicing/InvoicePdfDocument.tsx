import fs from "fs";
import path from "path";
import React from "react";
import { Document, Page, Text, View, Image, Font, StyleSheet } from "@react-pdf/renderer";
import type { InvoiceDetail } from "@/lib/database/adapters/invoicing-adapter";
import { formatColones } from "@/lib/utils";

// Puerto 1:1 de design-demos/invoice-demos/mix-a-directa.html (aprobado, ya
// iterado). El mockup es a 816x1056px (Letter @96dpi); react-pdf dibuja
// Letter a 612x792pt (@72dpi). 816*0.75=612 y 1056*0.75=792 exacto, así que
// todo valor en px del CSS se porta como px*0.75 = pt. No repintar el diseño
// acá — cualquier cambio visual va en el HTML primero.
const PX = 0.75;
const px = (n: number) => n * PX;
// letter-spacing del CSS está en em (relativo al font-size); react-pdf pide
// puntos absolutos, así que se resuelve em*fontSizePx antes de pasar a pt.
const em = (value: number, fontSizePx: number) => value * fontSizePx * PX;

// Google Fonts subsetea por rango de unicode: "latin" (U+0000-00FF, trae
// dígitos/letras/₡ NO) y "latin-ext" (U+0100+, trae ₡=U+20A1 pero NO
// dígitos) son rangos disjuntos, no un superset uno del otro -- ningún
// archivo suelto de @fontsource trae ambos a la vez (verificado con
// fontTools contra los .woff reales). Geist ni siquiera trae ₡ en ningún
// subset. Solución: "latin" como fuente primaria (texto normal, números) y
// "FrauncesExt" (latin-ext) como familia de *fallback* SOLO para el glifo
// ₡ vía fontFamily en array -- react-pdf prueba cada familia del array en
// orden y usa la primera que tenga el glifo (@react-pdf/layout
// getFragments$1 + textkit fontSubstitution/pickFontFromFontStack).
const FONT_DIR = path.join(process.cwd(), "node_modules", "@fontsource");
Font.register({
  family: "Fraunces",
  fonts: [
    { src: path.join(FONT_DIR, "fraunces", "files", "fraunces-latin-400-italic.woff"), fontWeight: 400, fontStyle: "italic" },
    { src: path.join(FONT_DIR, "fraunces", "files", "fraunces-latin-500-normal.woff"), fontWeight: 500 },
    { src: path.join(FONT_DIR, "fraunces", "files", "fraunces-latin-700-normal.woff"), fontWeight: 700 },
    { src: path.join(FONT_DIR, "fraunces", "files", "fraunces-latin-800-normal.woff"), fontWeight: 800 },
    { src: path.join(FONT_DIR, "fraunces", "files", "fraunces-latin-900-normal.woff"), fontWeight: 900 },
  ],
});
Font.register({
  family: "Geist",
  fonts: [
    { src: path.join(FONT_DIR, "geist", "files", "geist-latin-400-normal.woff"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "geist", "files", "geist-latin-600-normal.woff"), fontWeight: 600 },
    { src: path.join(FONT_DIR, "geist", "files", "geist-latin-700-normal.woff"), fontWeight: 700 },
    { src: path.join(FONT_DIR, "geist", "files", "geist-latin-800-normal.woff"), fontWeight: 800 },
  ],
});
// Solo-fallback: nunca es la fuente primaria de un estilo, así que no
// importa que le falten dígitos -- solo se consulta para el glifo ₡.
Font.register({
  family: "FrauncesExt",
  fonts: [
    { src: path.join(FONT_DIR, "fraunces", "files", "fraunces-latin-ext-500-normal.woff"), fontWeight: 500 },
    { src: path.join(FONT_DIR, "fraunces", "files", "fraunces-latin-ext-700-normal.woff"), fontWeight: 700 },
    { src: path.join(FONT_DIR, "fraunces", "files", "fraunces-latin-ext-800-normal.woff"), fontWeight: 800 },
    { src: path.join(FONT_DIR, "fraunces", "files", "fraunces-latin-ext-900-normal.woff"), fontWeight: 900 },
  ],
});

const emblemBuffer = fs.readFileSync(
  path.join(process.cwd(), "public", "brand", "logos", "logo-circle-original-no-background.png")
);

const OBSIDIAN = "#1a1208";
const BONE = "#CEC19C";
const BONE_MUTE = "#8f8262";
const EMBER = "#F46734";
const PAPER = "#EFE8D5";
const CELL = "#DFD4B4";
const GRID = "#A99B78";
const RULE = "#CFC3A2";
const INK_SOFT = "#5c4d33";

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
// UTC a propósito: fecha_emision/vencimiento llegan como timestamp de Postgres;
// usar getters locales podría restar un día según la zona horaria del server.
function formatDateEs(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
}

const ESTADO_LABEL: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};

// factura_item.descripcion se guarda como "Nombre - Talla" (ver
// create_invoice_from_order); no hay columna talla separada en el tipo.
function splitTalla(descripcion: string): { desc: string; talla: string } {
  const i = descripcion.lastIndexOf(" - ");
  if (i === -1) return { desc: descripcion, talla: "" };
  return { desc: descripcion.slice(0, i), talla: descripcion.slice(i + 3) };
}

const styles = StyleSheet.create({
  page: { backgroundColor: PAPER, color: OBSIDIAN, fontFamily: "Geist", flexDirection: "column" },

  bandTop: {
    backgroundColor: OBSIDIAN,
    paddingTop: px(44), paddingRight: px(56), paddingBottom: px(38), paddingLeft: px(56),
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
  },
  col: { flexDirection: "column" },
  wordmark: { fontFamily: "Fraunces", fontWeight: 900, fontSize: px(60), lineHeight: 0.82, letterSpacing: em(-0.035, 60), color: BONE },
  wordmarkSub: { fontSize: px(17), fontWeight: 600, letterSpacing: em(0.22, 17), textTransform: "uppercase", color: BONE_MUTE, marginTop: px(13) },
  bandRight: { flexDirection: "column", alignItems: "flex-end" },
  docKind: { fontSize: px(9), fontWeight: 700, letterSpacing: em(0.32, 9), textTransform: "uppercase", color: BONE_MUTE },
  docNumber: { fontFamily: "Fraunces", fontWeight: 800, fontSize: px(23), letterSpacing: em(0.01, 23), color: EMBER, marginTop: px(8), lineHeight: 1 },
  docState: {
    marginTop: px(12), backgroundColor: EMBER, color: OBSIDIAN,
    paddingTop: px(5), paddingRight: px(11), paddingBottom: px(6), paddingLeft: px(11),
    fontSize: px(8.5), fontWeight: 800, letterSpacing: em(0.2, 8.5), textTransform: "uppercase",
  },

  body: { paddingTop: px(44), paddingRight: px(56), paddingBottom: px(40), paddingLeft: px(56), flexDirection: "column", flex: 1 },

  meta: { flexDirection: "row" },
  metaBlock: { flexDirection: "column" },
  metaSub: { flexDirection: "row", justifyContent: "space-between", marginTop: px(30) },
  label: { fontSize: px(9), fontWeight: 700, letterSpacing: em(0.16, 9), textTransform: "uppercase", color: INK_SOFT, marginBottom: px(8) },
  clienteName: { fontFamily: "Fraunces", fontWeight: 700, fontSize: px(20), lineHeight: 1.15, letterSpacing: em(-0.01, 20) },
  clienteLine: { fontSize: px(12), color: INK_SOFT, lineHeight: 1.6 },
  fechaValue: { fontSize: px(12), fontWeight: 600, lineHeight: 1.45 },

  table: { flexDirection: "column", borderLeftWidth: px(1), borderLeftColor: GRID, borderTopWidth: px(1), borderTopColor: GRID, marginTop: px(24) },
  tr: { flexDirection: "row" },
  th: {
    backgroundColor: CELL, borderRightWidth: px(1), borderRightColor: GRID, borderBottomWidth: px(1), borderBottomColor: GRID,
    paddingTop: px(9), paddingRight: px(12), paddingBottom: px(9), paddingLeft: px(12),
    fontSize: px(9), fontWeight: 700, letterSpacing: em(0.14, 9), textTransform: "uppercase", color: INK_SOFT,
  },
  td: {
    borderRightWidth: px(1), borderRightColor: GRID, borderBottomWidth: px(1), borderBottomColor: GRID,
    paddingTop: px(13), paddingRight: px(12), paddingBottom: px(13), paddingLeft: px(12),
    fontSize: px(12), lineHeight: 1.3,
  },
  tdStrong: { fontWeight: 700 },
  // Geist no tiene el glifo ₡ en ningún subset -> fallback a FrauncesExt.
  tdMoney: { fontFamily: ["Geist", "FrauncesExt"] },
  r: { textAlign: "right" },
  c: { textAlign: "center" },
  cIdx: { width: "7%" },
  cDesc: { width: "41%" },
  cVar: { width: "12%" },
  cQty: { width: "10%" },
  cPrice: { width: "15%" },
  cTot: { width: "15%" },

  ruleHair: { height: px(1), backgroundColor: RULE },
  ruleInk: { height: px(1.5), backgroundColor: OBSIDIAN },

  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: px(34) },
  totals: { width: "46%", flexDirection: "column" },
  tLine: { flexDirection: "row", justifyContent: "space-between", paddingTop: px(9), paddingBottom: px(9) },
  tLineFirst: { flexDirection: "row", justifyContent: "space-between", paddingTop: 0, paddingBottom: px(9) },
  tLabel: { fontSize: px(12), color: INK_SOFT, letterSpacing: em(0.02, 12) },
  // "Fraunces" (subset "latin") no trae el glifo ₡ -> fallback a FrauncesExt.
  tValue: { fontFamily: ["Fraunces", "FrauncesExt"], fontSize: px(13), fontWeight: 500 },

  grand: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: px(14) },
  grandLabel: { fontSize: px(10), fontWeight: 600, letterSpacing: em(0.18, 10), textTransform: "uppercase", color: INK_SOFT, paddingBottom: px(7) },
  grandValue: { fontFamily: ["Fraunces", "FrauncesExt"], fontWeight: 900, fontSize: px(36), lineHeight: 0.9, letterSpacing: em(-0.03, 36), color: EMBER },

  foot: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: px(22) },
  quote: { fontFamily: "Fraunces", fontStyle: "italic", fontSize: px(17), lineHeight: 1.35, maxWidth: px(340) },
  footNote: { fontSize: px(11), color: INK_SOFT, lineHeight: 1.65, marginTop: px(12), maxWidth: px(360) },
  footContact: { flexDirection: "column", alignItems: "flex-end" },
  emblem: { width: px(66), height: px(66) },
  footContactLine: { fontSize: px(10), letterSpacing: em(0.1, 10), textTransform: "uppercase", color: EMBER, lineHeight: 1.8, marginTop: px(12) },
});

export function InvoicePdfDocument({ detail }: { detail: InvoiceDetail }) {
  const { factura, items, descuentos } = detail;
  const estadoLabel = ESTADO_LABEL[factura.estado_calculado] ?? factura.estado_calculado;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.bandTop}>
          <View style={styles.col}>
            <Text style={styles.wordmark}>BRUMA</Text>
            <Text style={styles.wordmarkSub}>Fightwear</Text>
          </View>
          <View style={styles.bandRight}>
            <Text style={styles.docKind}>Factura</Text>
            <Text style={styles.docNumber}>{factura.numero_factura}</Text>
            <Text style={styles.docState}>{estadoLabel}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.meta}>
            <View style={[styles.metaBlock, { width: "52%" }]}>
              <Text style={styles.label}>Facturado a</Text>
              <Text style={styles.clienteName}>{factura.cliente_nombre}</Text>
            </View>
            <View style={[styles.metaBlock, { width: "48%" }]}>
              <Text style={styles.label}>Contacto</Text>
              {factura.cliente_email && <Text style={styles.clienteLine}>{factura.cliente_email}</Text>}
              {factura.cliente_telefono && <Text style={styles.clienteLine}>{factura.cliente_telefono}</Text>}
            </View>
          </View>

          <View style={styles.metaSub}>
            <View style={styles.metaBlock}>
              <Text style={styles.label}>Pedido</Text>
              <Text style={styles.fechaValue}>#{factura.id_pedido}</Text>
            </View>
            <View style={styles.metaBlock}>
              <Text style={styles.label}>Emisión</Text>
              <Text style={styles.fechaValue}>{formatDateEs(factura.fecha_emision)}</Text>
            </View>
            <View style={[styles.metaBlock, { alignItems: "flex-end" }]}>
              <Text style={styles.label}>Vencimiento</Text>
              <Text style={styles.fechaValue}>{formatDateEs(factura.fecha_vencimiento)}</Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tr}>
              <Text style={[styles.th, styles.cIdx, styles.c]}>N°</Text>
              <Text style={[styles.th, styles.cDesc]}>Descripción</Text>
              <Text style={[styles.th, styles.cVar, styles.c]}>Talla</Text>
              <Text style={[styles.th, styles.cQty, styles.c]}>Cant.</Text>
              <Text style={[styles.th, styles.cPrice, styles.r]}>Unitario</Text>
              <Text style={[styles.th, styles.cTot, styles.r]}>Importe</Text>
            </View>
            {items.map((item, idx) => {
              const { desc, talla } = splitTalla(item.descripcion);
              const importe = item.cantidad * Number(item.precio_unitario);
              return (
                <View style={styles.tr} key={item.id_item}>
                  <Text style={[styles.td, styles.cIdx, styles.c]}>{String(idx + 1).padStart(2, "0")}</Text>
                  <Text style={[styles.td, styles.cDesc]}>{desc}</Text>
                  <Text style={[styles.td, styles.cVar, styles.c]}>{talla}</Text>
                  <Text style={[styles.td, styles.cQty, styles.c]}>{item.cantidad}</Text>
                  <Text style={[styles.td, styles.cPrice, styles.r, styles.tdMoney]}>{formatColones(item.precio_unitario)}</Text>
                  <Text style={[styles.td, styles.cTot, styles.r, styles.tdStrong, styles.tdMoney]}>{formatColones(importe)}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.totalsWrap}>
            <View style={styles.totals}>
              <View style={styles.tLineFirst}>
                <Text style={styles.tLabel}>Subtotal</Text>
                <Text style={styles.tValue}>{formatColones(factura.subtotal)}</Text>
              </View>
              {(descuentos ?? []).map((d) => (
                <React.Fragment key={d.id_descuento}>
                  <View style={styles.ruleHair} />
                  <View style={styles.tLine}>
                    <Text style={styles.tLabel}>
                      {d.descripcion}
                      {d.tipo === "porcentaje" ? ` (${Number(d.valor)}%)` : ""}
                    </Text>
                    <Text style={styles.tValue}>{"−" + formatColones(d.monto)}</Text>
                  </View>
                </React.Fragment>
              ))}
              <View style={styles.ruleInk} />
              <View style={styles.grand}>
                <Text style={styles.grandLabel}>Total a pagar</Text>
                <Text style={styles.grandValue}>{formatColones(factura.total)}</Text>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          <View style={styles.ruleHair} />
          <View style={styles.foot}>
            <View style={styles.col}>
              <Text style={styles.quote}>«Ante la bruma, mente serena.»</Text>
              <Text style={styles.footNote}>
                Gracias por unirte a nuestra comunidad. En el tatami y en la calle, somos el equilibrio entre la calma y el caos.
              </Text>
            </View>
            <View style={styles.footContact}>
              <Image style={styles.emblem} src={emblemBuffer} />
              <Text style={styles.footContactLine}>@brumafightwear</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
