import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET route for fetching a loan by ID
export async function GET(req, { params }) {
    const { id } = params;

    try {
        const data = await prisma.loan.findUnique({
            where: { id: Number(id) },
        });

        if (!data) {
            return NextResponse.json({ result: 'Loan not found' }, { status: 404 });
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Error fetching loan:', error);
        return NextResponse.json({ result: 'Error fetching loan' }, { status: 500 });
    }
}

// PUT route for updating a loan by ID
export async function PUT(req, { params }) {
    const { id } = params;
    const payload = await req.json();

    const loanId = parseInt(id);
    if (isNaN(loanId)) {
        return NextResponse.json({ result: 'Invalid loan ID' }, { status: 400 });
    }

    const existingLoan = await prisma.loan.findUnique({
        where: { id: loanId },
    });

    if (!existingLoan) {
        return NextResponse.json({ result: 'Record to update not found' }, { status: 404 });
    }

    const updateData = {};
    if (payload.loanName !== undefined) updateData.loanName = payload.loanName;
    if (payload.loanAmount !== undefined) updateData.loanAmount = parseFloat(payload.loanAmount);
    if (payload.annualInterestRate !== undefined) updateData.annualInterestRate = parseFloat(payload.annualInterestRate);
    if (payload.emiAmount !== undefined) updateData.emiAmount = parseFloat(payload.emiAmount);
    if (payload.loanStartDate !== undefined) updateData.loanStartDate = new Date(payload.loanStartDate);
    if (payload.priority !== undefined) updateData.priority = parseInt(payload.priority);
    if (payload.minimumPay !== undefined) updateData.minimumPay = parseFloat(payload.minimumPay);

    try {
        const loan = await prisma.loan.update({
            where: { id: loanId },
            data: updateData,
        });

        return NextResponse.json({ result: loan }, { status: 200 });
    } catch (error) {
        console.error('Error updating loan:', error);
        return NextResponse.json({ result: 'Update failed' }, { status: 500 });
    }
}

// DELETE route for deleting a loan by ID
export async function DELETE(req, { params }) {
    const { id } = params;

    const loanId = parseInt(id);
    if (isNaN(loanId)) {
        return NextResponse.json({ result: 'Invalid loan ID' }, { status: 400 });
    }

    try {
        await prisma.loan.delete({
            where: { id: loanId },
        });

        return NextResponse.json({ result: 'Loan deleted successfully' }, { status: 200 });
    } catch (error) {
        console.error('Error deleting loan:', error);
        return NextResponse.json({ result: 'Delete failed' }, { status: 500 });
    }
}
