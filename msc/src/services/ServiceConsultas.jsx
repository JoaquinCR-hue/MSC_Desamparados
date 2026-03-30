import axios from 'axios';

const URL_CONSULTAS = 'http://localhost:3001/consultas';

const ServiceConsultas = {
    getConsultas: async () => {
        try {
            const response = await axios.get(URL_CONSULTAS);
            return response.data;
        } catch (error) {
            console.error("Error al obtener consultas", error);
            throw error;
        }
    },
    postConsulta: async (consulta) => {
        try {
            const response = await axios.post(URL_CONSULTAS, consulta);
            return response.data;
        } catch (error) {
            console.error("Error al publicar consulta", error);
            throw error;
        }
    },
    putConsulta: async (consulta, id) => {
        try {
            const response = await axios.put(`${URL_CONSULTAS}/${id}`, consulta);
            return response.data;
        } catch (error) {
            console.error("Error al actualizar consulta", error);
            throw error;
        }
    }
};

export default ServiceConsultas;
