import os
from datetime import datetime, date
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from app.core.config import settings

def calculate_age(dob: date) -> str:
    today = date.today()
    years = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if years >= 2:
        return f"{years} Years"
    months = (today.year - dob.year) * 12 + today.month - dob.month
    if months >= 1:
        return f"{months} Months"
    days = (today - dob).days
    return f"{days} Days"

def get_field_val(obj, field_name, default=""):
    if isinstance(obj, dict):
        return obj.get(field_name, default)
    return getattr(obj, field_name, default)

def generate_prescription_pdf(
    prescription_number: str,
    doctor_name: str,
    doctor_qualification: str,
    doctor_license: str,
    doctor_specialization: str,
    doctor_hospital: str,
    child_name: str,
    child_dob: date,
    child_gender: str,
    child_blood_group: str,
    parent_name: str,
    consultation_date: date,
    diagnosis: str,
    additional_advice: str,
    follow_up_date: date,
    items: list
) -> str:
    """
    Generates a professional digital pediatric prescription PDF using ReportLab.
    Complies with Telemedicine Practice Guidelines.
    """
    filename = f"{prescription_number}.pdf"
    file_path = os.path.join(settings.PRESCRIPTION_UPLOAD_DIR, filename)

    doc = SimpleDocTemplate(
        file_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Styles
    brand_title_style = ParagraphStyle(
        'BrandTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0284c7')
    )
    
    clinic_tag_style = ParagraphStyle(
        'ClinicTag',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#059669')
    )
    
    doc_name_style = ParagraphStyle(
        'DocName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        alignment=2 # Right aligned
    )
    
    doc_sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#475569'),
        alignment=2 # Right aligned
    )
    
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#0369a1')
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )
    
    th_style = ParagraphStyle(
        'TableHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )
    
    td_style = ParagraphStyle(
        'TableData',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1e293b')
    )
    
    rx_symbol_style = ParagraphStyle(
        'RxSymbol',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0284c7')
    )

    story = []

    # 1. Header (Clinic Left, Doctor Right)
    clinic_col = [
        Paragraph("CareConnect", brand_title_style),
        Paragraph("Pediatric Healthcare & Online Consultation", clinic_tag_style),
        Spacer(1, 3),
        Paragraph("Telemedicine Clinic | Verified Pediatric Specialists", body_style),
    ]
    
    doc_col = [
        Paragraph(f"Dr. {doctor_name}", doc_name_style),
        Paragraph(f"{doctor_qualification}", doc_sub_style),
        Paragraph(f"Reg No: {doctor_license} | {doctor_specialization}", doc_sub_style),
        Paragraph(f"{doctor_hospital}", doc_sub_style),
    ]
    
    header_table = Table([[clinic_col, doc_col]], colWidths=[280, 250])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=10))

    # 2. Patient & Consultation Info Card
    age_str = calculate_age(child_dob)
    gender_str = child_gender or "Not Specified"
    blood_str = child_blood_group or "Unknown"
    date_str = consultation_date.strftime("%d %b %Y") if hasattr(consultation_date, 'strftime') else str(consultation_date)

    patient_info_data = [
        [
            Paragraph(f"<b>Patient Name:</b> {child_name}", body_style),
            Paragraph(f"<b>Age / Gender:</b> {age_str} / {gender_str}", body_style),
            Paragraph(f"<b>Prescription No:</b> {prescription_number}", body_style)
        ],
        [
            Paragraph(f"<b>Parent/Guardian:</b> {parent_name}", body_style),
            Paragraph(f"<b>Blood Group:</b> {blood_str}", body_style),
            Paragraph(f"<b>Consultation Date:</b> {date_str}", body_style)
        ]
    ]
    patient_table = Table(patient_info_data, colWidths=[180, 175, 175])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 12))

    # 3. Clinical Assessment & Diagnosis
    story.append(Paragraph("Clinical Diagnosis & Notes:", section_title_style))
    story.append(Spacer(1, 4))
    diag_box = Table([[Paragraph(diagnosis or "General Pediatric Health Checkup", body_style)]], colWidths=[530])
    diag_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f9ff')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#bae6fd')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(diag_box)
    story.append(Spacer(1, 14))

    # 4. Rx Symbol & Medicines Table
    story.append(Paragraph("℞ Prescribed Medications", rx_symbol_style))
    story.append(Spacer(1, 6))

    rx_table_data = [
        [
            Paragraph("#", th_style),
            Paragraph("Medicine Name", th_style),
            Paragraph("Dosage", th_style),
            Paragraph("Frequency", th_style),
            Paragraph("Duration", th_style),
            Paragraph("Administration Instructions", th_style)
        ]
    ]

    for idx, item in enumerate(items, start=1):
        m_name = get_field_val(item, 'medicine_name')
        m_dose = get_field_val(item, 'dosage')
        m_freq = get_field_val(item, 'frequency')
        m_dur = get_field_val(item, 'duration')
        m_inst = get_field_val(item, 'instructions', '-') or '-'
        rx_table_data.append([
            Paragraph(str(idx), td_style),
            Paragraph(f"<b>{m_name}</b>", td_style),
            Paragraph(str(m_dose), td_style),
            Paragraph(str(m_freq), td_style),
            Paragraph(str(m_dur), td_style),
            Paragraph(str(m_inst), td_style)
        ])

    rx_table = Table(rx_table_data, colWidths=[25, 140, 65, 95, 65, 140])
    rx_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284c7')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#0284c7')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(rx_table)
    story.append(Spacer(1, 14))

    # 5. Additional Advice / Follow-up
    advice_items = []
    if additional_advice:
        advice_items.append(Paragraph(f"<b>Dietary & General Advice:</b> {additional_advice}", body_style))
    if follow_up_date:
        f_date_str = follow_up_date.strftime("%d %b %Y") if hasattr(follow_up_date, 'strftime') else str(follow_up_date)
        advice_items.append(Paragraph(f"<b>Recommended Follow-up Date:</b> {f_date_str}", body_bold))
    
    if not advice_items:
        advice_items.append(Paragraph("Keep child well-hydrated. Contact immediately if high fever persists or breathing difficulty occurs.", body_style))

    advice_table = Table([[item] for item in advice_items], colWidths=[530])
    advice_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ecfdf5')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#a7f3d0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(advice_table)
    story.append(Spacer(1, 16))

    # 6. Doctor Signature & Telemedicine Legal Disclaimer
    sig_block = [
        Paragraph("Digitally Signed by:", ParagraphStyle('SigHeader', parent=styles['Normal'], fontName='Helvetica', fontSize=8, textColor=colors.HexColor('#64748b'), alignment=2)),
        Paragraph(f"Dr. {doctor_name}", ParagraphStyle('SigDoc', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#0f172a'), alignment=2)),
        Paragraph(f"Reg: {doctor_license}", ParagraphStyle('SigReg', parent=styles['Normal'], fontName='Helvetica', fontSize=8, textColor=colors.HexColor('#64748b'), alignment=2)),
        Paragraph(f"Date: {date_str}", ParagraphStyle('SigDate', parent=styles['Normal'], fontName='Helvetica', fontSize=8, textColor=colors.HexColor('#64748b'), alignment=2)),
    ]
    
    disclaimer_block = [
        Paragraph("<b>Telemedicine Practice Disclaimer:</b> This digital prescription is issued in compliance with the Telemedicine Practice Guidelines. It is valid for the medical conditions evaluated during this online pediatric consultation. In case of sudden emergency, severe distress, or adverse reactions, please proceed immediately to the nearest pediatric emergency hospital.", ParagraphStyle('Disc', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#94a3b8')))
    ]

    footer_table = Table([[disclaimer_block, sig_block]], colWidths=[360, 170])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(KeepTogether([
        HRFlowable(width="100%", thickness=0.75, color=colors.HexColor('#cbd5e1'), spaceAfter=8),
        footer_table
    ]))

    doc.build(story)
    return file_path
