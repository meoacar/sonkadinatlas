'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Table,
    Button,
    Space,
    Tag,
    Modal,
    Form,
    Input,
    Switch,
    InputNumber,
    message,
    Popconfirm,
    Card,
    Spin,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiClient } from '@/providers/dataProvider';

const { TextArea } = Input;
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

interface Page {
    id: string;
    slug: string;
    titleTr: string;
    titleEn?: string;
    contentTr: string;
    contentEn?: string;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export default function PagesManagement() {
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<Page | null>(null);

    // Fetch pages
    const { data: pages, isLoading } = useQuery<Page[]>({
        queryKey: ['pages'],
        queryFn: async () => {
            const { data } = await apiClient.get('/pages/admin/list');
            return data;
        },
    });

    // Create mutation
    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await apiClient.post('/pages', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages'] });
            message.success('Sayfa başarıyla oluşturuldu');
            handleCloseModal();
        },
        onError: () => {
            message.error('Sayfa oluşturulamadı');
        },
    });

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: any }) => {
            const res = await apiClient.put(`/pages/${id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages'] });
            message.success('Sayfa başarıyla güncellendi');
            handleCloseModal();
        },
        onError: () => {
            message.error('Sayfa güncellenemedi');
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { data } = await apiClient.delete(`/pages/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pages'] });
            message.success('Sayfa başarıyla silindi');
        },
        onError: () => {
            message.error('Sayfa silinemedi');
        },
    });

    const handleOpenModal = (page?: Page) => {
        if (page) {
            setEditingPage(page);
            form.setFieldsValue({
                slug: page.slug,
                titleTr: page.titleTr,
                titleEn: page.titleEn || '',
                contentTr: page.contentTr,
                contentEn: page.contentEn || '',
                isActive: page.isActive,
                sortOrder: page.sortOrder,
            });
        } else {
            setEditingPage(null);
            form.resetFields();
            form.setFieldsValue({
                isActive: true,
                sortOrder: 0,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPage(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (editingPage) {
                updateMutation.mutate({ id: editingPage.id, data: values });
            } else {
                createMutation.mutate(values);
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    const columns: ColumnsType<Page> = [
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
            render: (slug: string) => <code>{slug}</code>,
        },
        {
            title: 'Başlık (TR)',
            dataIndex: 'titleTr',
            key: 'titleTr',
        },
        {
            title: 'Başlık (EN)',
            dataIndex: 'titleEn',
            key: 'titleEn',
            render: (titleEn?: string) => titleEn || '-',
        },
        {
            title: 'Durum',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'success' : 'default'}>
                    {isActive ? 'Aktif' : 'Pasif'}
                </Tag>
            ),
        },
        {
            title: 'Sıra',
            dataIndex: 'sortOrder',
            key: 'sortOrder',
        },
        {
            title: 'İşlemler',
            key: 'actions',
            render: (_: any, record: Page) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => window.open(`${WEB_URL}/sayfa/${record.slug}`, '_blank')}
                        title="Web Sitesinde Görüntüle"
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(record)}
                        title="Düzenle"
                    />
                    <Popconfirm
                        title="Sayfayı Sil"
                        description="Bu sayfayı silmek istediğinizden emin misiniz?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Sil"
                        cancelText="İptal"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            title="Sil"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ margin: 0 }}>Sayfa Yönetimi</h1>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleOpenModal()}
                >
                    Yeni Sayfa
                </Button>
            </div>

            <Card>
                <Table
                    columns={columns}
                    dataSource={pages}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Henüz sayfa eklenmemiş' }}
                />
            </Card>

            <Modal
                title={editingPage ? 'Sayfa Düzenle' : 'Yeni Sayfa Oluştur'}
                open={isModalOpen}
                onOk={handleSubmit}
                onCancel={handleCloseModal}
                width={800}
                okText={editingPage ? 'Güncelle' : 'Oluştur'}
                cancelText="İptal"
                confirmLoading={createMutation.isPending || updateMutation.isPending}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        isActive: true,
                        sortOrder: 0,
                    }}
                >
                    <Form.Item
                        label="Slug (URL)"
                        name="slug"
                        rules={[{ required: true, message: 'Slug gereklidir' }]}
                        extra="Örnek: hakkimizda, gizlilik-politikasi, kullanim-kosullari (Web sitesinde /sayfa/<slug> olarak açılır)"
                    >
                        <Input placeholder="gizlilik-politikasi" />
                    </Form.Item>

                    <Form.Item
                        label="Başlık (Türkçe)"
                        name="titleTr"
                        rules={[{ required: true, message: 'Türkçe başlık gereklidir' }]}
                    >
                        <Input placeholder="Gizlilik Politikası" />
                    </Form.Item>

                    <Form.Item
                        label="Başlık (İngilizce)"
                        name="titleEn"
                    >
                        <Input placeholder="Privacy Policy" />
                    </Form.Item>

                    <Form.Item
                        label="İçerik (Türkçe)"
                        name="contentTr"
                        rules={[{ required: true, message: 'Türkçe içerik gereklidir' }]}
                        extra="Markdown desteklenir"
                    >
                        <TextArea rows={10} placeholder="# Başlık&#10;&#10;İçerik..." />
                    </Form.Item>

                    <Form.Item
                        label="İçerik (İngilizce)"
                        name="contentEn"
                        extra="Markdown desteklenir"
                    >
                        <TextArea rows={10} placeholder="# Title&#10;&#10;Content..." />
                    </Form.Item>

                    <Form.Item
                        label="Sıra"
                        name="sortOrder"
                    >
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        label="Aktif"
                        name="isActive"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
