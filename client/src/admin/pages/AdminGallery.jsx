import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../layout/AdminLayout';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import TableActions from '../components/TableActions';
import ViewDetailsModal from '../components/ViewDetailsModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import GalleryFormModal from '../components/GalleryFormModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { formatDate } from '../utils/formatDate';
import {
  createGalleryImage,
  deleteGalleryImage,
  getAdminGallery,
  updateGalleryImage,
} from '../services/adminApi';

const PAGE_SIZE = 10;

export default function AdminGallery() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [images, setImages] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [editingImage, setEditingImage] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebouncedValue(search);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminGallery({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
      });

      setImages(data.data.images);
      setPagination(data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load gallery images.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteGalleryImage(deleteTarget._id);

      if (images.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchImages();
      }

      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete gallery image.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveImage = async (payload) => {
    setSaving(true);
    setError('');

    try {
      if (formMode === 'edit' && editingImage) {
        await updateGalleryImage(editingImage._id, payload);
      } else {
        await createGalleryImage(payload);
      }

      setFormMode(null);
      setEditingImage(null);
      await fetchImages();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save gallery image.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'image',
      label: 'Image',
      className: 'w-24',
      render: (row) => (
        <img
          src={row.image}
          alt={row.title}
          className="h-14 w-20 rounded-lg object-cover ring-1 ring-stone-200"
        />
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (row) => <span className="font-medium text-forest">{row.title}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <span className="line-clamp-2 max-w-xs text-stone-500">{row.description}</span>
      ),
    },
    {
      key: 'featured',
      label: 'Featured',
      render: (row) =>
        row.featured ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron/10 px-3 py-1 text-xs font-semibold text-saffron-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-saffron" />
            Featured
          </span>
        ) : (
          <span className="text-xs text-stone-400">—</span>
        ),
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'whitespace-nowrap',
      render: (row) => (
        <TableActions
          onView={() => setSelectedImage(row)}
          onEdit={() => {
            setEditingImage(row);
            setFormMode('edit');
          }}
          onDelete={() => setDeleteTarget(row)}
        />
      ),
    },
  ];

  const rows = images.map((image) => ({
    id: image._id,
    ...image,
  }));

  return (
    <AdminLayout>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Management</p>
            <h2 className="mt-2 font-playfair text-2xl font-bold text-forest sm:text-3xl">
              Gallery
            </h2>
            <p className="mt-2 text-sm text-stone-500 sm:text-base">
              Manage images shown on the public Gallery page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingImage(null);
              setFormMode('add');
            }}
            className="btn-primary px-5 py-2.5"
          >
            Add Image
          </button>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <section className="card overflow-hidden p-4 sm:p-6">
          <SearchBar
            value={search}
            onChange={setSearch}
            label="Search gallery"
            placeholder="Search by title or description"
          />

          <div className="mt-6">
            <DataTable
              columns={columns}
              rows={rows}
              loading={loading}
              emptyMessage="No gallery images found."
            />
          </div>

          <div className="mt-6">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          </div>
        </section>
      </div>

      <ViewDetailsModal
        isOpen={!!selectedImage}
        title="Gallery Image Details"
        onClose={() => setSelectedImage(null)}
        fields={
          selectedImage
            ? [
                { label: 'Title', value: selectedImage.title },
                { label: 'Description', value: selectedImage.description, multiline: true },
                { label: 'Image', value: selectedImage.image },
                { label: 'Featured', value: selectedImage.featured ? 'Yes' : 'No' },
                { label: 'Created Date', value: formatDate(selectedImage.createdAt) },
              ]
            : []
        }
      />

      <GalleryFormModal
        isOpen={!!formMode}
        mode={formMode || 'add'}
        initialImage={editingImage}
        loading={saving}
        onSubmit={handleSaveImage}
        onClose={() => {
          setFormMode(null);
          setEditingImage(null);
        }}
      />

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Delete Gallery Image"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will remove it from the public Gallery page.`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AdminLayout>
  );
}
