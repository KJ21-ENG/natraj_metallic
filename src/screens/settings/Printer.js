import React, { useState, useEffect } from 'react';
import { Container, Form, Card } from 'react-bootstrap';

const Printer = () => {
    const [labelPrinter, setLabelPrinter] = useState('');
    const [invoicePrinter, setInvoicePrinter] = useState('');
    const [availablePrinters, setAvailablePrinters] = useState([]);

    useEffect(() => {
        // TODO: Get list of available printers from the system
        // This will need to be implemented in the main process
        const fetchPrinters = async () => {
            // Placeholder for printer list
            const dummyPrinters = ['Printer 1', 'Printer 2', 'Printer 3'];
            setAvailablePrinters(dummyPrinters);
        };

        fetchPrinters();
    }, []);

    const handleLabelPrinterChange = (e) => {
        setLabelPrinter(e.target.value);
        // TODO: Save the selected printer
    };

    const handleInvoicePrinterChange = (e) => {
        setInvoicePrinter(e.target.value);
        // TODO: Save the selected printer
    };

    return (
        <Container fluid className="p-3">
            <Card>
                <Card.Header>
                    <h4>Printer Settings</h4>
                </Card.Header>
                <Card.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Printer for Label</Form.Label>
                            <Form.Select 
                                value={labelPrinter}
                                onChange={handleLabelPrinterChange}
                            >
                                <option value="">Select Printer</option>
                                {availablePrinters.map((printer, index) => (
                                    <option key={index} value={printer}>
                                        {printer}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Printer for Chalan/Invoice</Form.Label>
                            <Form.Select
                                value={invoicePrinter}
                                onChange={handleInvoicePrinterChange}
                            >
                                <option value="">Select Printer</option>
                                {availablePrinters.map((printer, index) => (
                                    <option key={index} value={printer}>
                                        {printer}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default Printer; 