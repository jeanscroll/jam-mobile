import React, { useState } from 'react';
//import { createClient } from "@/lib/supabaseBrowserClient";
import { motion } from 'framer-motion';

interface JobApplication {
    job_title: string;
    contract_type: string;
    company_logo_path: string;
    company_name: string;
    application_date: string;
    application_status: string;
}

interface UserTableProps {
    applications: JobApplication[];
    className?: string;
}

//const supabase = createClient();

// const getImageUrl = (bucket: string, path: string) => {
//     return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
// };

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'Accepté': return 'text-green-600 bg-green-100 px-2 py-1 rounded-full';
        case 'En attente': return 'text-gray-600 bg-gray-100 px-2 py-1 rounded-full';
        case 'Refusé': return 'text-red-600 bg-red-100 px-2 py-1 rounded-full';
        default: return 'text-gray-600';
    }
};

const UserTable: React.FC<UserTableProps> = ({ applications, className }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof JobApplication, direction: 'asc' | 'desc' } | null>(null);
    const itemsPerPage = 9; // Number of items per page

    const sortedApplications = React.useMemo(() => {
        const sortableApplications = [...applications];
        if (sortConfig !== null) {
            sortableApplications.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableApplications;
    }, [applications, sortConfig]);

    const totalPages = Math.ceil(sortedApplications.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const currentApplications = sortedApplications.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const requestSort = (key: keyof JobApplication) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortArrow = (key: keyof JobApplication) => {
        if (sortConfig?.key === key) {
            return sortConfig.direction === 'asc' ? '↑' : '↓';
        }
        return '';
    };

    return (
        <motion.div
            className={`overflow-x-auto w-full bg-white border rounded-lg ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.table
                className="min-w-full table-auto border-collapse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                key={`${sortConfig?.key ?? ''}${sortConfig?.direction ?? ''}`}
            >
                <thead className="bg-gray-200 text-gray-900">
                    <tr>
                        <th className="px-4 py-3 text-left">Intitulé de poste</th>
                        <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort('contract_type')}>
                            Contrat {getSortArrow('contract_type')}
                        </th>
                        <th className="px-4 py-3 text-left">Entreprises</th>
                        <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort('application_date')}>
                            Postulé le {getSortArrow('application_date')}
                        </th>
                        <th className="px-4 py-3 text-left cursor-pointer" onClick={() => requestSort('application_status')}>
                            Statut {getSortArrow('application_status')}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {currentApplications.map((application, index) => (
                        <motion.tr
                            key={index}
                            className="border-t border-b"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                            <td className="px-4 py-3">{application.job_title}</td>
                            <td className="px-4 py-3">{application.contract_type}</td>
                            <td className="px-4 py-3 flex items-center gap-2">
                                <img className="w-1/6" src="https://idwomihieftgogbgivic.supabase.co/storage/v1/object/public/img//64527ea280c2622554fb4698_logo-scroll.svg" alt={application.company_name} />
                                {application.company_name}
                            </td>
                            <td className="px-4 py-3">{formatDate(application.application_date)}</td>
                            <td className="px-4 py-3">
                                <span className={getStatusClass(application.application_status)}>
                                    {application.application_status}
                                </span>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </motion.table>
            <div className="flex justify-between items-center p-4 absolute bottom-0 w-full">
                <motion.button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border-2 border-black text-black rounded-full disabled:opacity-50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    Précédent
                </motion.button>
                <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, index) => (
                        <motion.button
                            key={index}
                            onClick={() => handlePageChange(index + 1)}
                            className={`px-4 py-2 rounded ${currentPage === index + 1 ? 'bg-green-100 text-black' : 'bg-gray-200 text-gray-700'}`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {index + 1}
                        </motion.button>
                    ))}
                </div>
                <motion.button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border-2 border-black text-black rounded-full disabled:opacity-50"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    Suivant
                </motion.button>
            </div>
        </motion.div>
    );
};

export default UserTable;